const prisma = require('../config/prisma');

const recordAudit = async (userId, action, entityType, entityId, details = null) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
      }
    });
  } catch (err) {
    console.error('Failed to log audit event:', err.message);
  }
};

module.exports = { recordAudit };

