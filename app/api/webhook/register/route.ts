import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";


export async function POST(req:Request){
    const WEBHOOK_SECRET=process.env.WEBHOOK_SECRET
    if(!WEBHOOK_SECRET){
        throw new Error("Please add webhook secret secret in env");
    }
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const  svix_timestamp=headerPayload.get("svix_timestamp")
    const svix_signature=headerPayload.get("svix-signature")
    if(!svix_id||!svix_signature||!svix_timestamp){
        return new Response("Error occured-No svix headers")
    }
    const payload=await req.json()
    const body=JSON.stringify(payload)
    const wh=new Webhook(WEBHOOK_SECRET)
    let evt:WebhookEvent
    try {
        evt=wh.verify(body,{
            "svix-id":svix_id,
            "svix-signature":svix_signature,
            "svix-timestamp":svix_timestamp
        }) as WebhookEvent
    } catch (error) {
        console.error("Error verifying webhook")
        return new Response("Error Occured",{status:400})
    }
    const {id}=evt.data
    const eventType=evt.type
    if(eventType==="user.created"){
        try {
            const {email_addresses,primary_email_address_id}=evt.data
            const primaryEmail=email_addresses.find(
                (email)=>email.id===primary_email_address_id
            )
            if(!primaryEmail){
              return new Response("no primary email found",{status:400})
            }
            const newUser=await prisma.user.create({
                data:{
                    id:evt.data.id!,
                    email:primaryEmail.email_address,
                    isSubscribed:false
                }
            })
            console.log("New User Created",newUser)
        } catch (error) {
            return new Response("error in creating user in database",{status:500}) 
        }
    }
    return new Response("Webhook received successfully",{status:200})
}