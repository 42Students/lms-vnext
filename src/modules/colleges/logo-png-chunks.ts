/**
 * Validate the structure and CRCs of a small, browser-cropped PNG.
 * A PNG signature/IHDR alone is not proof of an actual image: arbitrary
 * attacker bytes could otherwise be placed behind the public logo proxy.
 * This intentionally does not replace malware scanning or decoding.
 */
function crc32(bytes:Uint8Array,start:number,end:number):number{
 let crc=0xffffffff;
 for(let i=start;i<end;i++){
  crc^=bytes[i]!;
  for(let bit=0;bit<8;bit++){
   crc=(crc&1)?((crc>>>1)^0xedb88320):(crc>>>1);
  }
 }
 return (crc^0xffffffff)>>>0;
}

export function verifyCollegeLogoPngChunks(bytes:Uint8Array):boolean{
 // Eight signature bytes, 25-byte IHDR (length+type+data+CRC), IDAT and IEND.
 if(bytes.length<57||bytes.length>2*1024*1024)return false;
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let offset=8;
 let ihdr=false,idat=false,iend=false,closedIdat=false;
 while(offset<bytes.length){
  if(bytes.length-offset<12)return false;
  const length=view.getUint32(offset,false);
  if(length>bytes.length-offset-12)return false;
  const next=offset+length+12;
  const type=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
  if(!/^[A-Za-z]{4}$/.test(type)||type[2]!==type[2]?.toUpperCase())return false;
  const expected=view.getUint32(next-4,false);
  if(crc32(bytes,offset+4,next-4)!==expected)return false;
  if(!ihdr){
   if(type!=="IHDR"||length!==13)return false;
   ihdr=true;
   // Non-interlaced 8-bit truecolour/RGBA only, as produced by the crop UI.
   if(bytes[offset+26]!==0||bytes[offset+27]!==0||
      bytes[offset+28]!==0)return false;
  }else if(type==="IHDR")return false;
  else if(type==="IDAT"){
   if(closedIdat||iend)return false;
   idat=true;
  }else if(type==="IEND"){
   if(length!==0||!idat||next!==bytes.length)return false;
   iend=true;
  }else{
   if(idat)closedIdat=true;
   if(iend||type==="acTL"||type==="fcTL"||type==="fdAT")return false;
   if(type==="PLTE"&&(length===0||length%3!==0||length>768))return false;
   // Unknown critical chunks are not supported by the small PNG upload
   // contract. Ancillary chunks are allowed only with valid CRC.
   if(type[0]===type[0]?.toUpperCase()&&type!=="PLTE")return false;
  }
  offset=next;
 }
 return ihdr&&idat&&iend&&offset===bytes.length;
}
