import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { familyRelationshipId } = await req.json();

    if (!familyRelationshipId) {
      return Response.json({ error: 'Missing familyRelationshipId' }, { status: 400 });
    }

    // Generate new invite token
    const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Update the FamilyRelationship record
    await base44.entities.FamilyRelationship.update(familyRelationshipId, {
      invite_token: inviteToken,
    });

    // Generate invite link
    const baseUrl = Deno.env.get('APP_URL') || 'https://lifescribe.base44.app';
    const inviteLink = `${baseUrl}/family-invite?token=${inviteToken}`;

    return Response.json({ inviteLink, inviteToken });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});