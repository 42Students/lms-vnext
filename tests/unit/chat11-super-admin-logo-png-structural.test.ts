import {describe,expect,it} from "vitest";
import {deflateSync} from "node:zlib";
import {verifyCollegeLogoPngChunks} from "@/modules/colleges/logo-png-chunks";

// Build actual PNG bytes rather than weakening the validator with header-only fixtures.
function chunk(name:string,payload:Uint8Array){
 const buffer=Buffer.alloc(payload.length+12);
 buffer.writeUInt32BE(payload.length,0);
 buffer.write(name,4,4,"ascii");
 buffer.set(payload,8);
 let crc=0xffffffff;
 for(const value of buffer.subarray(4,8+payload.length)){
  crc^=value;
  for(let bit=0;bit<8;bit++)crc=crc&1?(crc>>>1)^0xedb88320:crc>>>1;
 }
 buffer.writeUInt32BE((crc^0xffffffff)>>>0,buffer.length-4);
 return buffer;
}
function png(chunks:readonly Buffer[]){
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),...chunks]);
}
const ihdr=Buffer.from([0,0,0,1,0,0,0,1,8,6,0,0,0]);
const idat=deflateSync(Buffer.from([0,0,0,0,0]));
const baseline=()=>png([chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0))]);
describe("SA-tenants-modules-BRAND-PNG-06 validated branding asset structure",()=>{
 it("accepts the full IHDR, compressed IDAT and IEND CRC-checked stream",()=>{
  expect(verifyCollegeLogoPngChunks(baseline())).toBe(true);
 });
 it("rejects header-only, truncated or checksum-mutated disguised images",()=>{
  const valid=baseline();
  expect(verifyCollegeLogoPngChunks(valid.subarray(0,33))).toBe(false);
  expect(verifyCollegeLogoPngChunks(valid.subarray(0,valid.length-1))).toBe(false);
  const corrupt=Buffer.from(valid);
  corrupt[34]^=1;
  expect(verifyCollegeLogoPngChunks(corrupt)).toBe(false);
  expect(verifyCollegeLogoPngChunks(Buffer.concat([valid,Buffer.from("<script>")]))).toBe(false);
 });
 it("rejects forbidden ancillary animation, noncontiguous IDAT and unknown critical chunks",()=>{
  expect(verifyCollegeLogoPngChunks(png([
   chunk("IHDR",ihdr),chunk("acTL",Buffer.alloc(8)),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0)),
  ]))).toBe(false);
  expect(verifyCollegeLogoPngChunks(png([
   chunk("IHDR",ihdr),chunk("IDAT",idat),chunk("tEXt",Buffer.from("x")),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0)),
  ]))).toBe(false);
  expect(verifyCollegeLogoPngChunks(png([
   chunk("IHDR",ihdr),chunk("ABCD",Buffer.alloc(0)),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0)),
  ]))).toBe(false);
 });
 it("SA-tenants-modules-BRAND-PNG-07 rejects invalid deflate, decompression bombs and scanline filters",()=>{
  const invalidDeflate=png([
   chunk("IHDR",ihdr),chunk("IDAT",Buffer.from("not-zlib")),chunk("IEND",Buffer.alloc(0)),
  ]);
  expect(verifyCollegeLogoPngChunks(invalidDeflate)).toBe(false);
  const invalidFilter=png([
   chunk("IHDR",ihdr),chunk("IDAT",deflateSync(Buffer.from([9,0,0,0,0]))),
   chunk("IEND",Buffer.alloc(0)),
  ]);
  expect(verifyCollegeLogoPngChunks(invalidFilter)).toBe(false);
  const oversizedScanline=png([
   chunk("IHDR",ihdr),chunk("IDAT",deflateSync(Buffer.alloc(10000))),
   chunk("IEND",Buffer.alloc(0)),
  ]);
  expect(verifyCollegeLogoPngChunks(oversizedScanline)).toBe(false);
  const wrongSig=baseline();
  wrongSig[0]=0;
  expect(verifyCollegeLogoPngChunks(wrongSig)).toBe(false);
 });
 it("rejects oversized compressed payload and interlaced-crop masquerades",()=>{
  const huge=new Uint8Array(2*1024*1024+1);
  expect(verifyCollegeLogoPngChunks(huge)).toBe(false);
  const interlaced=Buffer.from(ihdr);
  interlaced[12]=1;
  expect(verifyCollegeLogoPngChunks(png([
   chunk("IHDR",interlaced),chunk("IDAT",idat),chunk("IEND",Buffer.alloc(0)),
  ]))).toBe(false);
 });
});
