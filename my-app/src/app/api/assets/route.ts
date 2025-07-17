import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const response = await prisma.asset.findMany();

    if (response.length === 0) {
      return NextResponse.json(
        { status: "error", message: "No assets found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { status: "success", assets: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { status: "error", message: "Error while fetching assets" },
      { status: 500 }
    );
  }
}
