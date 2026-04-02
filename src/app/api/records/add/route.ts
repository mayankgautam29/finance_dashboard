import { connect } from "@/dbconfig/dbconnect";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import { NextRequest, NextResponse } from "next/server";
import Record from "@/models/recordModel";

export async function POST(req: NextRequest){
    try {
        await connect();
        const id = await getDataFromToken(req);
        const {amount,type,category,note} = await req.json();
        const newRec = new Record({
            userId: id,
            amount: amount,
            type: type,
            date: Date.now(),
            category: category,
            note: note
        })
        const savedRec = await newRec.save();
        return NextResponse.json({message: "Record saved successfully"},savedRec);
    } catch (error:any) {
        return NextResponse.json({error: "Something went wrong in the backend"},error.message);
    }
}