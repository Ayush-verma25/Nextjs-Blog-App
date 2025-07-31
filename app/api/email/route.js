// app/api/email/route.js
import { NextResponse } from "next/server";
import { ConnectDB } from "@/lib/config/db";
import EmailModel from "@/lib/models/EmailModels";

export async function POST(request) {
  await ConnectDB();
  const formData = await request.formData();
  const email = formData.get("email");
  if (!email) {
    return NextResponse.json({ success: false, msg: "Email is required" }, { status: 400 });
  }
  await EmailModel.create({ email });
  return NextResponse.json({ success: true, msg: "Email Subscribed" });
}

export async function GET() {
  await ConnectDB();
  const emails = await EmailModel.find({}).sort({ date: -1 });
  return NextResponse.json({ emails });
}

export async function DELETE(request) {
  await ConnectDB();
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ success: false, msg: "ID is required" }, { status: 400 });
  }
  await EmailModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true, msg: "Email Deleted" });
}
