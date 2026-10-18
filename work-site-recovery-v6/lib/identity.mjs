export function normalizeEmployeeId(value){
 if(typeof value!=='string')throw Error('EMPLOYEE_ID');
 const normalized=value.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).toUpperCase();
 if(!/^[A-Z0-9-]{3,30}$/.test(normalized))throw Error('EMPLOYEE_ID');return normalized;
}
export function normalizeRecoveryCode(value){return typeof value==='string'?value.replace(/[\s-]/g,'').toUpperCase():'';}
