import { getDataFromToken } from "@/helpers/getDataFromToken";
import { request } from "http";
import { NextRequest, NextResponse } from "next/server";
import { _success } from "zod/v4/core";
export async function GET(request: NextRequest){
    try {
        const usr = await getDataFromToken(request);
        if(!usr){
            return NextResponse.json({user: null})
        }
        const response = new NextResponse(JSON.stringify({message: "Logout successfull",success: true}))
        response.cookies.set('token',"",{httpOnly: true,expires: new Date(0)})
        return response
    } catch (error:any) {
        return NextResponse.json({user: null})
    }
}