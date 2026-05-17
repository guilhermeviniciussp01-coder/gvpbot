// Stub entities — dados mockados localmente
export const Lead = {
  list: () => Promise.resolve([]),
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
  delete: () => Promise.resolve({}),
};

export const Conversation = {
  list: () => Promise.resolve([]),
  create: () => Promise.resolve({}),
  update: () => Promise.resolve({}),
};

export const Message = {
  list: () => Promise.resolve([]),
  create: () => Promise.resolve({}),
};

export const Metric = {
  list: () => Promise.resolve([]),
  create: () => Promise.resolve({}),
};

export const Notification = {
  list: () => Promise.resolve([]),
  create: () => Promise.resolve({}),
};

export const User = {
  me: () => Promise.resolve(null),
  update: () => Promise.resolve({}),
};
