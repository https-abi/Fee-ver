import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/db";
import { searchMedicalRates, initializeDatabase } from "@/lib/medical-rates";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const searchTerm = searchParams.get("search");

    switch (action) {
      case "test-connection":
        const isConnected = await testConnection();
        return NextResponse.json({
          success: isConnected,
          message: isConnected
            ? "Database connection successful"
            : "Database connection failed",
        });

      case "init-database":
        const initialized = await initializeDatabase();
        return NextResponse.json({
          success: initialized,
          message: initialized
            ? "Database initialized successfully"
            : "Database initialization failed",
        });

      case "search":
        if (!searchTerm) {
          return NextResponse.json(
            { error: "Search term is required" },
            { status: 400 }
          );
        }

        const searchResult = await searchMedicalRates(searchTerm);
        return NextResponse.json({
          searchTerm,
          result: searchResult,
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use: test-connection, init-database, or search",
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database operation failed",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchTerms } = await req.json();

    if (!Array.isArray(searchTerms)) {
      return NextResponse.json(
        { error: "searchTerms must be an array" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      searchTerms.map(async (term: string) => {
        const result = await searchMedicalRates(term);
        return {
          searchTerm: term,
          ...result,
        };
      })
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error: any) {
    console.error("Batch search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Batch search failed",
      },
      { status: 500 }
    );
  }
}