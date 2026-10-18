export async function connectTrainer(db:D1Database,siteUser:string,uid:string){
 // The first verified trainer on this existing private owner account adopts only
 // that account's legacy Sites sessions. Other trainers keep separate ownership.
 await db.batch([
  db.prepare('INSERT INTO trainer_links(site_user,firebase_uid,created_at) VALUES(?,?,?) ON CONFLICT(site_user) DO NOTHING').bind(siteUser,uid,Date.now()),
  db.prepare('UPDATE sessions SET owner=? WHERE owner=? AND EXISTS(SELECT 1 FROM trainer_links WHERE site_user=? AND firebase_uid=?)').bind('firebase:'+uid,siteUser,siteUser,uid),
 ]);
}
