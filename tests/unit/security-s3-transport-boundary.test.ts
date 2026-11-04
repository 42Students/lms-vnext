import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {
  deleteObject,getObjectStream,headObject,presignUrl,replaceObjectMetadata,
  signedFetch,
} from "@/modules/storage/s3-client";
import {getPrivateR2Config} from "@/modules/storage/r2-config";

const config={
  endpoint:"https://acct.r2.cloudflarestorage.com",
  bucket:"vnext-private",
  accessKeyId:"test-access-key",
  secretAccessKey:"test-secret-key",
  keyPrefix:"scoped/",
};
const fetchMock=vi.fn<typeof fetch>();
const url=(path="private/college/member/document.pdf")=>presignUrl(config,{
  method:"GET",key:path,
});
const hdr=(extras:Record<string,string>={})=>({
  "content-type":"application/pdf","content-length":"10",
  ...extras,
});
const part=(contentRange:string,length="10")=>new Response("0123456789",{
  status:206,
  headers:hdr({"content-range":contentRange,"content-length":length}),
});

beforeEach(()=>{fetchMock.mockReset();vi.stubGlobal("fetch",fetchMock);});
afterEach(()=>{vi.unstubAllGlobals();});

describe("Private S3/R2 transport never follows redirected signed requests",()=>{
  it("blocks redirects for HEAD and DELETE, retaining no-store",async()=>{
    fetchMock.mockResolvedValueOnce(new Response(null,{status:404}))
      .mockResolvedValueOnce(new Response(null,{status:204}));
    expect(await headObject(config,"private/a")).toBe(null);
    await deleteObject(config,"private/a");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    for(const [calledUrl,init] of fetchMock.mock.calls){
      expect(new URL(String(calledUrl)).hostname).toBe("acct.r2.cloudflarestorage.com");
      expect(init).toMatchObject({redirect:"error",cache:"no-store"});
    }
  });
  it("blocks following redirects for full and range GETs",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("safe",{headers:{"content-length":"4"}}))
      .mockResolvedValueOnce(part("bytes 0-9/20"));
    expect((await getObjectStream(config,"private/a"))?.sizeBytes).toBe(4);
    expect((await getObjectStream(config,"private/a",{start:0,end:9}))?.sizeBytes).toBe(10);
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method:"GET",redirect:"error",cache:"no-store",
    });
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method:"GET",redirect:"error",cache:"no-store",
      headers:{range:"bytes=0-9"},
    });
  });
  it("blocks following redirects when SigV4 Authorization is sent in headers",async()=>{
    fetchMock.mockResolvedValueOnce(new Response(null,{status:200}));
    await signedFetch(config,{method:"GET",path:"/vnext-private/scoped/private/a"});
    const [requested,options]=fetchMock.mock.calls[0]!;
    expect(new URL(String(requested)).hostname).toBe("acct.r2.cloudflarestorage.com");
    expect(options).toMatchObject({redirect:"error",cache:"no-store"});
    expect((options?.headers as Record<string,string>).authorization).toMatch(/^AWS4-HMAC-SHA256 /);
  });
  it("blocks redirects when replacing scan/ownership metadata",async()=>{
    fetchMock.mockResolvedValueOnce(new Response(null,{status:200}));
    await replaceObjectMetadata(config,"private/a",{"malware-scan-status":"CLEAN"},"application/pdf");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({method:"PUT",redirect:"error"});
  });
});

describe("Signed URL boundaries and protected headers",()=>{
  it.each([
    "http://acct.r2.cloudflarestorage.com",
    "https://evil@acct.r2.cloudflarestorage.com",
    "https://acct.r2.cloudflarestorage.com/other-bucket",
    "https://acct.r2.cloudflarestorage.com/?x=1",
    "https://acct.r2.cloudflarestorage.com/#secret",
  ])("rejects malformed or downgraded credentialed endpoint: %s",endpoint=>{
    expect(()=>presignUrl({...config,endpoint},{method:"GET",key:"private/a"}))
      .toThrow("S3_ENDPOINT_INVALID");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each(["host","HOST","Authorization"])("rejects signing a caller-controlled %s header",header=>{
    expect(()=>presignUrl(config,{method:"GET",key:"private/a",
      headers:{[header]:"evil.example.test"}})).toThrow("S3_SIGNED_HEADERS_INVALID");
  });
  it.each([
    {"content-type":"image/png\r\nx-auth: attacker"},
    {"x-amz-meta-note":"value\nextra"},
    {"x-amz-meta-note":"value\twith-tab"},
    {"content-type":"application/pdf","CONTENT-TYPE":"image/png"},
    {"Bad:Header":"value"},
  ])("rejects header splitting and ambiguous signer inputs",headers=>{
    expect(()=>presignUrl(config,{method:"GET",key:"private/a",headers}))
      .toThrow("S3_SIGNED_HEADERS_INVALID");
  });
  it.each(["host","x-amz-content-sha256","x-amz-date","authorization"])
    ("protects computed Authorization signer header %s",header=>{
      expect(signedFetch(config,{method:"HEAD",path:"/vnext-private/private/a",
        headers:{[header]:"spoofed"})).rejects.toThrow("S3_SIGNED_HEADERS_INVALID");
      expect(fetchMock).not.toHaveBeenCalled();
    });
  it.each([
    "../different-bucket",
    "/vnext-private/../public/data",
    "/vnext-private/private?other=1",
    "/vnext-private/private#fragment",
    "/vnext-private/private\\file",
  ])("refuses a signed storage path escape or query: %s",path=>{
    expect(signedFetch(config,{method:"HEAD",path}))
      .rejects.toThrow("S3_SIGNED_PATH_INVALID");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps valid signed URLs, including known private storage key prefixes",()=>{
    const signed=new URL(url());
    expect(signed.protocol).toBe("https:");
    expect(signed.pathname).toBe("/vnext-private/scoped/private/college/member/document.pdf");
    expect(signed.searchParams.get("X-Amz-Signature")).toMatch(/^[a-f0-9]{64}$/);
    expect(signed.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
  });
});

describe("Private-range verification refuses unbounded or lying provider replies",()=>{
  it("refuses a 200 full object response for a requested tiny byte range",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("whole-object",{status:200,
      headers:{"content-length":"12"}}));
    await expect(getObjectStream(config,"private/file",{start:0,end:9}))
      .rejects.toThrow("S3_RANGE_RESPONSE_INVALID");
  });
  it.each([
    ["bytes 1-10/20","10"],
    ["bytes 0-11/20","12"],
    ["bytes 0-9/9","10"],
    ["bytes */20","10"],
    ["bytes 0-9/*","10"],
    ["bytes 0-9/20","9"],
    ["bytes 0-9/20","999999999999999999999"],
  ])("refuses mismatched Content-Range / length header %s / %s",async(contentRange,length)=>{
    fetchMock.mockResolvedValueOnce(part(contentRange,length));
    await expect(getObjectStream(config,"private/a",{start:0,end:9}))
      .rejects.toThrow(/S3_(RANGE_RESPONSE|CONTENT_LENGTH)_INVALID/);
  });
  it("accepts a valid smaller-than-requested last partial range at EOF",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("abc",{status:206,
      headers:{"content-range":"bytes 0-2/3","content-length":"3"},
    }));
    expect((await getObjectStream(config,"private/a",{start:0,end:100}))?.sizeBytes).toBe(3);
  });
  it.each(["NaN","-1","1.1","90071992547409930000","abc"])
    ("rejects malformed storage HEAD size %s, instead of treating it as trusted metadata",async length=>{
      fetchMock.mockResolvedValueOnce(new Response(null,{status:200,
        headers:{"content-length":length,"last-modified":"Wed, 21 Oct 2015 07:28:00 GMT"},
      }));
      await expect(headObject(config,"private/a")).rejects.toThrow("S3_CONTENT_LENGTH_INVALID");
    });
  it("continues accepting legitimate size and metadata for an R2 object",async()=>{
    fetchMock.mockResolvedValueOnce(new Response(null,{status:200,headers:{
      "content-length":"10","content-type":"application/pdf",
      "etag":"\"sha\"","last-modified":"Wed, 21 Oct 2015 07:28:00 GMT",
      "x-amz-meta-college-id":"college-a",
    }}));
    expect(await headObject(config,"private/a")).toEqual({
      etag:"sha",lastModifiedMs:Date.parse("Wed, 21 Oct 2015 07:28:00 GMT"),
      sizeBytes:10,contentType:"application/pdf",metadata:{"college-id":"college-a"},
    });
  });
});

describe("R2 account and bucket settings cannot redirect private signing",()=>{
  const env={
    APP_ENV:"production",
    R2_ACCOUNT_ID:"acct",
    R2_ACCESS_KEY:"test-access-key",
    R2_SECRET_KEY:"test-secret-key",
    R2_PRIVATE_BUCKET:"vnext-private",
    R2_BUCKET_NAME:"public-legacy",
  } as NodeJS.ProcessEnv;

  it("continues signing with a valid separated private bucket",()=>{
    expect(getPrivateR2Config(env)).toMatchObject({
      endpoint:"https://acct.r2.cloudflarestorage.com",bucket:"vnext-private",
    });
  });

  it.each([
    "acct.r2.cloudflarestorage.com@127.0.0.1",
    "acct/../other",
    "acct.evil",
    "acct:443",
    "a".repeat(65),
    "ac\nt",
  ])("rejects URL authority/path injection from R2_ACCOUNT_ID %s",account=>{
    expect(()=>getPrivateR2Config({...env,R2_ACCOUNT_ID:account}))
      .toThrowError(expect.objectContaining({code:"PRIVATE_STORAGE_BUCKET_UNSAFE"}));
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    "../public","private/../public","private\\data",
    "PRIVATE","a..b","a@b","-private","private.","private\nbucket",
  ])("rejects unsafe private bucket component %s",bucket=>{
    expect(()=>getPrivateR2Config({...env,R2_PRIVATE_BUCKET:bucket}))
      .toThrowError(expect.objectContaining({code:"PRIVATE_STORAGE_BUCKET_UNSAFE"}));
    expect(()=>presignUrl({...config,bucket},{method:"GET",key:"private/a"}))
      .toThrow("S3_BUCKET_INVALID");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("Streaming object length is enforced against actual delivered bytes",()=>{
  it("does not accept a chunked object with no authenticated Content-Length",async()=>{
    fetchMock.mockResolvedValueOnce(new Response(new ReadableStream<Uint8Array>({
      start(controller){controller.enqueue(new TextEncoder().encode("payload"));controller.close();},
    }),{status:200,headers:{"content-type":"application/octet-stream"}}));
    await expect(getObjectStream(config,"private/a"))
      .rejects.toThrow("S3_CONTENT_LENGTH_INVALID");
  });

  it("rejects a provider that sends more bytes than its declared length",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("0123456789EXTRA",{
      headers:{"content-length":"10"},
    }));
    const object=await getObjectStream(config,"private/a");
    expect(object?.sizeBytes).toBe(10);
    await expect(new Response(object!.body).arrayBuffer())
      .rejects.toThrow("S3_BODY_LENGTH_MISMATCH");
  });

  it("rejects a provider that truncates an object below its declared length",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("short",{
      headers:{"content-length":"10"},
    }));
    const object=await getObjectStream(config,"private/a");
    expect(object?.sizeBytes).toBe(10);
    await expect(new Response(object!.body).arrayBuffer())
      .rejects.toThrow("S3_BODY_LENGTH_MISMATCH");
  });

  it("accepts the exact declared content bytes, preserving private file reads",async()=>{
    fetchMock.mockResolvedValueOnce(new Response("good data",{
      headers:{"content-length":"9","content-type":"application/pdf"},
    }));
    const object=await getObjectStream(config,"private/a");
    expect(object?.sizeBytes).toBe(9);
    expect(object?.contentType).toBe("application/pdf");
    expect(await new Response(object!.body).text()).toBe("good data");
  });
});

describe("Canonical SigV4 query and object-key prefix integrity",()=>{
  it.each([
    "X-Amz-Signature","x-amz-signature",
    "X-Amz-Algorithm","X-Amz-Date","x-amz-expires",
    "X-Amz-Credential","X-Amz-Security-Token",
  ])("never accepts an injected or duplicated reserved SigV4 query parameter %s",key=>{
    expect(()=>presignUrl(config,{method:"GET",key:"private/a",
      query:{[key]:"attacker-value"}})).toThrow("S3_SIGNED_QUERY_INVALID");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects ambiguous case-folded extra query keys and control characters",()=>{
    for(const query of [
      {VersionId:"first",versionid:"second"},
      {"response-content-disposition":"attachment\r\nSet-Cookie: evil"},
      {"bad query name":"value"},
      {"x":"x".repeat(2049)},
    ]){
      expect(()=>presignUrl(config,{method:"GET",key:"private/a",query}))
        .toThrow("S3_SIGNED_QUERY_INVALID");
    }
  });

  it("still signs an ordinary object-version or response-disposition parameter",()=>{
    const signed=new URL(presignUrl(config,{
      method:"GET",key:"private/a",query:{
        versionId:"opaque-version",
        "response-content-disposition":"attachment; filename=receipt.pdf",
      },
    }));
    expect(signed.searchParams.get("versionId")).toBe("opaque-version");
    expect(signed.searchParams.get("response-content-disposition"))
      .toBe("attachment; filename=receipt.pdf");
    expect(signed.searchParams.getAll("X-Amz-Signature")).toHaveLength(1);
  });

  it.each([
    "../private/","/private/","prefix//","prefix/../private/",
    "prefix/./","prefix\\","prefix?/", "prefix#/",
  ])("prevents a configured object prefix from escaping the private namespace: %s",prefix=>{
    expect(()=>presignUrl({...config,keyPrefix:prefix},{method:"GET",key:"private/a"}))
      .toThrow("S3_KEY_PREFIX_INVALID");
  });

  it("does not mistake a valid scoped prefix for a traversal attempt",()=>{
    const signed=new URL(presignUrl(config,{method:"GET",key:"private/a"}));
    expect(signed.pathname).toBe("/vnext-private/scoped/private/a");
  });

  it("refuses doubled path separators in header-authenticated storage operations",async()=>{
    await expect(signedFetch(config,{
      method:"HEAD",path:"/vnext-private//private/a",
    })).rejects.toThrow("S3_SIGNED_PATH_INVALID");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
