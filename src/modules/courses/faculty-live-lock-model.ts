/** Co-teachers share this PostgreSQL advisory-lock namespace per delivery. */
export function facultyLiveDeliveryLockKey(deliveryId:string):string {
 return "faculty-live-delivery:"+deliveryId;
}
