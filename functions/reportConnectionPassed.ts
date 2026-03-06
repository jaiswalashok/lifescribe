import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { connection_id, connected_user_id, connected_user_name } = await req.json();

    // Log the report (in a real app, you might store this in a database or send an email)
    console.log(`User ${user.email} reported that ${connected_user_name} (ID: ${connected_user_id}) has passed away.`);

    // Send notification email to admin/support
    await base44.integrations.Core.SendEmail({
      to: 'lifescribe-reports@example.com',
      subject: `Report: Connection Passing - ${connected_user_name}`,
      body: `User ${user.full_name} (${user.email}) has reported that ${connected_user_name} has passed away.\n\nConnection ID: ${connection_id}\nConnected User ID: ${connected_user_id}\n\nPlease handle this account appropriately according to memorial procedures.`,
      from_name: 'Lifescribe',
    });

    return Response.json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Error reporting connection passed:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});