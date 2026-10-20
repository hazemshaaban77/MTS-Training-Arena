/** Trusted, strictly parsed player URL for explicit public YouTube video links.
 * Everything else is rendered as a native video src (no arbitrary HTML/iframe origin).
 */
export function safeYouTubeEmbed(url:string):string|null{
 try{
  const u=new URL(url);
  if(u.protocol!=='https:')return null;
  const domain=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  let id:string|null=null;
  if(['www.youtube.com','youtube.com','m.youtube.com'].includes(domain)){
   if(u.pathname==='/watch')id=u.searchParams.get('v');
   else if(['embed','shorts','live'].includes(parts[0]))id=parts[1]||null;
  }else if(['youtu.be','www.youtu.be'].includes(domain))id=parts[0]||null;
  else if(['www.youtube-nocookie.com','youtube-nocookie.com'].includes(domain)&&parts[0]==='embed')id=parts[1]||null;
  if(id&&!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
  return id?'https://www.youtube-nocookie.com/embed/'+id+'?rel=0':null;
 }catch{return null;}
}
