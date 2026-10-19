// One-time, fixed-source reconstruction of the user's approved Hero image.
// GitHub's API stores text chunks as base64. Concatenate in this exact order,
// then base64-decode once to the original WebP. No external network destinations.
import {writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const blobs=["bcef92ee7d0bd3bf29cf22cc0170d1d4f143fb90","a8e5404d67b5f91c89cabe8b17f62b5c6d829650","6db261030ac5b71a98b659feec4512512cebda59","56a378b725e4f6e573742616038619a6fbc4ddb4","c97e678c7588eb2f2a925aa52e46f452cd7cf047","bf5bb3a5e0aad5b592abbce8d53a42d73bae6e19","07d241e0f71108a28cb4e20cb1756d45c65deb46","3f9d2d2c32221202cc5ad01aba4c272b500a69b4","bd1a2ee450c32e25288ace41daca67454e525742","f0c6c643653dd709f1039f10a323e5624625d505","ddcb00981a34850bee0dbc81db607719030fea36","d735ef337fb124500c0462e1bceaf45eac0421c7","7879cfd13f15535daa67486293b6864c3601fae6","0f53fdba75c97766ddb6d2eb848444ded32c2c39","c7bbd49228f24e36f60d16d85219e9701de8455b","5c7df56b364944246db95b2e620ee252da852fb8","81368ad5b18fe75b2e57f49c8aaa854c5ed4ddaa","4d4947f5f85ac1c9a0b0b4e794bfdd534427a590","f0a0f5aec724de8e7193a7fa94e835b90e643c15","d678da8a568d8b6c1915d83e7a642e5052add1d8","7713d92e391b696eb9bda22790dcbddcee2893e8","9a2fbd36109a5475fd411e211a672b90114d575c","8cca9ccf79747361cdaac1b0c1e75146640b1c73","ff837e4a8b6c60e9d5fb44ed42a4ee561d1752d7","337ff659e93efa7dd943813c366f45610f04b760","923dd923a7ca40b40474e1d3457ce98706e887e5"];
const repo='hazemshaaban77/MTS-Training-Arena';
const token=process.env.GH_TOKEN;
if(!token)throw Error('GITHUB_TOKEN is unavailable');
let encoded='';
for(const sha of blobs){
 const url='https://api.github.com/repos/'+repo+'/git/blobs/'+sha;
 const response=await fetch(url,{headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}});
 if(!response.ok)throw Error('Missing image part: '+sha+' HTTP '+response.status);
 const value=await response.json();
 if(value.encoding!=='base64')throw Error('Unexpected blob encoding');
 encoded+=Buffer.from(value.content.split(String.fromCharCode(10)).join(''),'base64').toString('utf8');
}
if(encoded.length!==47136||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw Error('Asset transport length or content mismatch');
const file=Buffer.from(encoded,'base64');
if(file.length!==35352||file.toString('ascii',0,4)!=='RIFF'||file.toString('ascii',8,12)!=='WEBP'||file.readUInt32LE(4)+8!==file.length)throw Error('Hero image failed WebP integrity check');
const path='work-site-recovery-v6/public/arena-hero-final.webp';
await mkdir('work-site-recovery-v6/public',{recursive:true});
await writeFile(path,file);
console.log('Validated '+path+' ('+file.length+' bytes), SHA-256: '+createHash('sha256').update(file).digest('hex'));
