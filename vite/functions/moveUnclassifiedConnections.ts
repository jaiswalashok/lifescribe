import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all circles for the user
    const circles = await base44.entities.Circle.filter({ created_by: user.email });
    let friendsCircle = circles.find(c => c.circle_type === 'friends');

    // If no friends circle exists, create one
    if (!friendsCircle) {
      friendsCircle = await base44.entities.Circle.create({
        name: 'Friends',
        circle_type: 'friends',
        privacy_setting: 'private'
      });
    }

    // Get all connections for the user that have no circle_id
    const allConnections = await base44.entities.Connection.filter({ user_id: user.email });
    const unclassifiedConnections = allConnections.filter(c => !c.circle_id);

    // Update each unclassified connection to the friends circle
    for (const connection of unclassifiedConnections) {
      await base44.entities.Connection.update(connection.id, {
        circle_id: friendsCircle.id
      });
    }

    return Response.json({
      success: true,
      message: `Moved ${unclassifiedConnections.length} unclassified connections to Friends circle`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});