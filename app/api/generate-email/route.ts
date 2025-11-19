import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { analysis_data, system_prompt } = await req.json();

    if (!analysis_data || !system_prompt) {
      return NextResponse.json({ error: 'Missing analysis data or system prompt.' }, { status: 400 });
    }

    const apiKey = "app-ykW8NPxY3BCxqk8j7h9srP4X";
    const baseUrl = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
    
    // NOTE: Replace YOUR_EMAIL_WORKFLOW_ID with the actual ID of your email-generator workflow in Dify.
    const workflowId = 'YOUR_EMAIL_WORKFLOW_ID'; 

    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error: DIFY_API_KEY is missing.' }, { status: 500 });
    }

    // 1. Construct the complete prompt for the Dify workflow
    // We package the system prompt and the data together since the Dify workflow has simple inputs.
    const fullPrompt = `${system_prompt.replace("[JSON_DATA_HERE]", JSON.stringify(analysis_data, null, 2))}`;

    const workflowRes = await fetch(`${baseUrl}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          analysis_data: fullPrompt, // Map the combined prompt to the 'analysis_data' input variable
        },
        response_mode: "blocking",
        user: "email_generator_user", // Unique identifier for tracking
        workflow_id: workflowId, // Use the specific workflow ID
      }),
    });

    const workflowData = await workflowRes.json();

    if (!workflowRes.ok) {
      console.error('Dify Workflow Error Response:', workflowData);
      throw new Error(workflowData.message || `Workflow Failed: ${workflowRes.statusText}`);
    }

    // 2. Extract the generated email content
    const generatedEmail = workflowData.data.outputs?.email_draft || 
                           workflowData.data.outputs?.text || 
                           "Failed to extract generated email content.";

    return NextResponse.json({ email: generatedEmail });

  } catch (error: any) {
    console.error('Email Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate reassessment email' },
      { status: 500 }
    );
  }
}