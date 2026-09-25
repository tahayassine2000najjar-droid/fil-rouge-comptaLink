export const notify = async (userId, type, title, message, metadata) => {
  console.log(`[Notification to ${userId}] ${title}: ${message}`);
  return true;
};
