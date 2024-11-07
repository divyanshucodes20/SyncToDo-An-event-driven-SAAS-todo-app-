import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { SubscriptIcon } from "lucide-react";

export async function POST(){
    const{userId}=auth()
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    //caputre payment after that add subscription
    try {
        const user=await prisma.user.findUnique({where:{id:userId}})
        if(!user){
            return NextResponse.json({error:"User not found"},{status:401})
        }
        const subscriptionEnds=new Date();
        subscriptionEnds.setMonth(subscriptionEnds.getMonth()+1)
        const updatedUser=await prisma.user.update({
            where:{id:userId},
            data:{
                isSubscribed:true,
                subscriptionEnds:subscriptionEnds
            }
        })
        return NextResponse.json({
            message:"Subscription successfully",
            subscriptionEnds:updatedUser.subscriptionEnds
        })
    } catch (error) {
        console.error("Error updating subscription",error)
        return NextResponse.json(
            {error:"Internal server error"},
            {status:500}
        )
    }
}
export async function GET(){
    const{userId}=auth()
    if(!userId){
        return NextResponse.json({error:"Unauthorized"},{status:401})
    }
    try {
        const user=await prisma.user.findUnique(
            {
                where:{id:userId},
                select:{
                    isSubscribed:true,
                    subscriptionEnds:true
                }
            },

        )
        if(!user){
            return NextResponse.json({error:"User not found"},{status:401})
        }
        const now=new Date()
        if(user.subscriptionEnds && user.subscriptionEnds<now){
            await prisma.user.update({
                where:{id:userId},
                data:{
                    isSubscribed:false,
                    subscriptionEnds:null
                }
            })
            return NextResponse.json({
                isSubscribed:false,
                subscriptIconEnds:null
            })
        }
        return NextResponse.json({
            isSubscribed:user.isSubscribed,
            subscriptIconEnds:user.subscriptionEnds
        })
    } catch (error) {
        
    }
}