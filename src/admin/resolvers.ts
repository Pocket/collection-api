export const resolvers = {
  Mutation: {
    createCollection: (_source, { data }) => {
      return {
        id: 1,
        slug: data.title.toLowerCase().replace(/\s+/g, '-'),
        title: data.title,
        excerpt: data.excerpt,
      };
    },
  },
};
