import {siteAsset} from '../../lib/site-path';
import {mainType} from '../../lib/catalog';

const artwork:Record<string,string>={
 'Quiz':'quiz',
 'Wheel of Fortune':'wheel-of-fortune',
 'Ultimate Game Show':'ultimate-game-show',
 'Meta Plan':'meta-plan',
 'Escape Room':'escape-room',
 'Live Poll':'live-poll',
 'Order It':'order-it',
 'Open the Box':'open-the-box',
 'Flashcards':'flashcards',
 'Scenario Challenge':'scenario-challenge',
};
export function activityArtSrc(activity:string|{type:string;mainType?:string}){
 const normalized=typeof activity==='string'?activity:mainType(activity as any);
 return siteAsset('/activity-art/'+(artwork[normalized]||'quiz')+'.webp');
}
export default function ActivityArt({activity,label,className='',eager=false}:{activity:string|{type:string;mainType?:string};label:string;className?:string;eager?:boolean}){
 return <img className={'activity-artwork '+className} src={activityArtSrc(activity)} alt={label} loading={eager?'eager':'lazy'} decoding="async"/>;
}
