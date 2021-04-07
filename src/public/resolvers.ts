export const resolvers = {
  Query: {
    getCollection: (_source, { slug }) => {
      return {
        id: slug,
        slug: slug,
        title: slug.replace(/-/g, ' '),
        excerpt: `You tried to get information about this slug: ${slug} but instead got just the slug, slightly modified back.`,
      };
    },
  },
};
