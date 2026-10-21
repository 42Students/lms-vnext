/** Minimal deterministic ZIP STORE writer; no zip or icon packages required.
 * Filenames are generated UUIDs, never untrusted remote Content-Disposition.
 * The output is capped well below the classic ZIP32 4GiB boundaries. */
export type ZipEntry={name:string;bytes:Uint8Array};
function crc32(bytes:Uint8Array):number{
 let crc=0xffffffff;
 for(const byte of bytes){
  crc^=byte;
  for(let i=0;i<8;i++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
 }
 return (crc^0xffffffff)>>>0;
}
export function makeStoredZip(files:readonly ZipEntry[]):Uint8Array{
 const localParts:Buffer[]=[];
 const centralParts:Buffer[]=[];
 let position=0;
 for(const file of files){
  if(!/^[a-zA-Z0-9._-]{1,120}$/.test(file.name)||
    file.name==="."||file.name==="..")
   throw new Error("Invalid ZIP entry name");
  const filename=Buffer.from(file.name,"utf8");
  const content=Buffer.from(file.bytes);
  const checksum=crc32(content);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);
  local.writeUInt16LE(20,4);
  local.writeUInt16LE(0,6);
  local.writeUInt16LE(0,8);
  local.writeUInt32LE(checksum,14);
  local.writeUInt32LE(content.byteLength,18);
  local.writeUInt32LE(content.byteLength,22);
  local.writeUInt16LE(filename.byteLength,26);
  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50,0);
  central.writeUInt16LE(20,4);
  central.writeUInt16LE(20,6);
  central.writeUInt32LE(checksum,16);
  central.writeUInt32LE(content.byteLength,20);
  central.writeUInt32LE(content.byteLength,24);
  central.writeUInt16LE(filename.byteLength,28);
  central.writeUInt32LE(position,42);
  localParts.push(local,filename,content);
  centralParts.push(central,filename);
  position+=local.byteLength+filename.byteLength+content.byteLength;
 }
 const directory=Buffer.concat(centralParts);
 const end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);
 end.writeUInt16LE(files.length,8);
 end.writeUInt16LE(files.length,10);
 end.writeUInt32LE(directory.byteLength,12);
 end.writeUInt32LE(position,16);
 return Uint8Array.from(Buffer.concat([...localParts,directory,end]));
}
