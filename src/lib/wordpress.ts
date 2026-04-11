import { GraphQLClient, gql } from 'graphql-request';
import fs from 'fs';
import path from 'path';

// Types
export interface WPPost {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  uri?: string;
  date: string;
  excerpt: string;
  content: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
      mediaDetails?: {
        width: number;
        height: number;
      };
    };
  };
  author?: {
    node: {
      name: string;
      avatar?: {
        url: string;
      };
    };
  };
  categories?: {
    nodes: WPCategory[];
  };
  tags?: {
    nodes: { name: string; slug: string }[];
  };
  seo?: WPSeo;
  comments?: {
    nodes: WPComment[];
  };
}

export interface WPComment {
  id: string;
  databaseId: number;
  content: string;
  date: string;
  author: {
    node: {
      name: string;
      avatar?: {
        url: string;
      };
    };
  };
  parentId?: string | null;
}

export interface WPCategory {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  count?: number;
  description?: string;
  uri?: string;
}

export interface WPTag {
  id: string;
  databaseId: number;
  name: string;
  slug: string;
  count?: number;
  description?: string;
  uri?: string;
}

export interface WPPage {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  seo?: WPSeo;
  date?: string;
  uri?: string;
}

export interface WPMenu {
  id: string;
  name: string;
  menuItems: {
    nodes: WPMenuItem[];
  };
}

export interface WPMenuItem {
  id: string;
  label: string;
  url: string;
  parentId?: string;
  childItems?: {
    nodes: WPMenuItem[];
  };
}

export interface WPSeo {
  title?: string;
  metaDesc?: string;
  opengraphTitle?: string;
  opengraphDescription?: string;
  opengraphImage?: {
    sourceUrl: string;
  };
}

export interface WPSiteInfo {
  generalSettings: {
    title: string;
    description: string;
    url: string;
  };
}

// GraphQL Fragments
const POST_FIELDS = gql`
  fragment PostFields on Post {
    id
    databaseId
    title
    slug
    uri
    date
    excerpt
    featuredImage {
      node {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
    author {
      node {
        name
        avatar {
          url
        }
      }
    }
    categories {
      nodes {
        id
        databaseId
        name
        slug
      }
    }
    tags {
      nodes {
        id
        databaseId
        name
        slug
      }
    }
    seo {
      title
      metaDesc
      opengraphTitle
      opengraphDescription
      opengraphImage {
        sourceUrl
      }
    }
  }
`;

// Client factory
export const getWPClient = (url: string): GraphQLClient => {
  if (!url) {
    throw new Error('WordPress URL not provided');
  }

  const graphqlUrl = url.endsWith('/graphql')
    ? url
    : `${url.replace(/\/$/, '')}/graphql`;

  return new GraphQLClient(graphqlUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Test connection
export const testConnection = async (url: string): Promise<{ success: boolean; message: string; siteInfo?: WPSiteInfo }> => {
  try {
    const client = getWPClient(url);

    const query = gql`
      query TestConnection {
        generalSettings {
          title
          description
          url
        }
      }
    `;

    const data = await client.request<WPSiteInfo>(query);

    return {
      success: true,
      message: 'Connection successful',
      siteInfo: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
};

// Check for Elementor
export const checkForElementor = async (url: string): Promise<{ hasElementor: boolean; warning?: string }> => {
  try {
    const client = getWPClient(url);

    const query = gql`
      query CheckElementor {
        posts(first: 5) {
          nodes {
            content
          }
        }
      }
    `;

    const data = await client.request<{ posts: { nodes: { content: string }[] } }>(query);

    const hasElementor = data.posts.nodes.some(post =>
      post.content?.includes('elementor') ||
      post.content?.includes('data-widget_type') ||
      post.content?.includes('elementor-section')
    );

    return {
      hasElementor,
      warning: hasElementor
        ? 'Elementor content detected. Please convert your pages to Gutenberg blocks for best compatibility.'
        : undefined,
    };
  } catch {
    return { hasElementor: false };
  }
};

// Fetch posts
export const getPosts = async (
  wpUrl: string,
  options: {
    first?: number;
    after?: string;
    categoryId?: number;
    search?: string;
    tagSlugIn?: string[];
  } = {}
): Promise<{ posts: WPPost[]; pageInfo: { hasNextPage: boolean; endCursor: string } }> => {
  const client = getWPClient(wpUrl);
  const { first = 10, after, categoryId, search, tagSlugIn } = options;

  const query = gql`
    ${POST_FIELDS}
    query GetPosts($first: Int!, $after: String, $categoryId: Int, $search: String, $tagSlugIn: [String]) {
      posts(
        first: $first
        after: $after
        where: { 
          categoryId: $categoryId
          search: $search
          tagSlugIn: $tagSlugIn
        }
      ) {
        nodes {
          ...PostFields
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const data = await client.request<{
    posts: { nodes: WPPost[]; pageInfo: { hasNextPage: boolean; endCursor: string } };
  }>(query, {
    first,
    after,
    categoryId: categoryId || null,
    search: search || null,
    tagSlugIn: tagSlugIn || null
  });

  return {
    posts: data.posts.nodes,
    pageInfo: data.posts.pageInfo,
  };
};

// Fetch tags
export const getTags = async (wpUrl: string): Promise<WPTag[]> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    query GetTags {
      tags(first: 100) {
        nodes {
          id
          databaseId
          name
          slug
          count
          description
          uri
        }
      }
    }
  `;
  const data = await client.request<{ tags: { nodes: WPTag[] } }>(query);
  return data.tags.nodes;
};

// Fetch single post by slug
export const getPostBySlug = async (wpUrl: string, slug: string): Promise<WPPost | null> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    ${POST_FIELDS}
    query GetPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        ...PostFields
        content
      }
    }
  `;
  const data = await client.request<{ post: WPPost | null }>(query, { slug });
  return data.post;
};

// Fetch categories
export const getCategories = async (wpUrl: string): Promise<WPCategory[]> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    query GetCategories {
      categories(first: 100) {
        nodes {
          id
          databaseId
          name
          slug
          count
          description
        }
      }
    }
  `;
  const data = await client.request<{ categories: { nodes: WPCategory[] } }>(query);
  return data.categories.nodes;
};

// Fetch all pages
export const getPages = async (wpUrl: string): Promise<WPPage[]> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    query GetPages {
      pages(first: 100) {
        nodes {
          id
          databaseId
          title
          slug
          date
          uri
        }
      }
    }
  `;
  const data = await client.request<{ pages: { nodes: (WPPage & { date: string, uri: string })[] } }>(query);
  return data.pages.nodes;
};

// Fetch page by slug
export const getPageBySlug = async (wpUrl: string, slug: string): Promise<WPPage | null> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    query GetPageBySlug($slug: ID!) {
      page(id: $slug, idType: URI) {
        id
        databaseId
        title
        slug
        content
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;
  const data = await client.request<{ page: WPPage | null }>(query, { slug });
  return data.page;
};

// Fetch menus
export const getMenuByLocation = async (wpUrl: string, location: string): Promise<WPMenu | null> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    query GetMenu($location: MenuLocationEnum!) {
      menus(where: { location: $location }) {
        nodes {
          id
          name
          menuItems {
            nodes {
              id
              label
              url
              parentId
            }
          }
        }
      }
    }
  `;
  try {
    const data = await client.request<{ menus: { nodes: WPMenu[] } }>(query, { location });
    return data.menus.nodes[0] || null;
  } catch {
    return null;
  }
};

// Search posts
export const searchPosts = async (wpUrl: string, searchTerm: string, first = 10): Promise<WPPost[]> => {
  const { posts } = await getPosts(wpUrl, { first, search: searchTerm });
  return posts;
};

// Get related posts
export const getRelatedPosts = async (
  wpUrl: string,
  postId: string,
  categoryIds: number[],
  limit = 4
): Promise<WPPost[]> => {
  const client = getWPClient(wpUrl);
  const query = gql`
    ${POST_FIELDS}
    query GetRelatedPosts($categoryIn: [ID], $notIn: [ID], $first: Int!) {
      posts(
        first: $first
        where: { 
          categoryIn: $categoryIn
          notIn: $notIn
        }
      ) {
        nodes {
          ...PostFields
        }
      }
    }
  `;
  const data = await client.request<{ posts: { nodes: WPPost[] } }>(query, {
    categoryIn: categoryIds.map(String),
    notIn: [postId],
    first: limit,
  });
  return data.posts.nodes;
};

// Get total counts for dashboard using REST API Headers (much faster and accurate)
export const getSiteCounts = async (wpUrl: string): Promise<{ posts: number; pages: number; categories: number }> => {
  // Construct REST API base URL
  const baseUrl = wpUrl.replace(/\/graphql\/?$/, '').replace(/\/$/, '');

  const getCount = async (endpoint: string): Promise<number> => {
    try {
      const res = await fetch(`${baseUrl}/wp-json/wp/v2/${endpoint}?per_page=1`);
      if (!res.ok) return 0;
      const total = res.headers.get('x-wp-total');
      return total ? parseInt(total, 10) : 0;
    } catch (e) {
      return 0;
    }
  };

  try {
    const [posts, pages, categories] = await Promise.all([
      getCount('posts'),
      getCount('pages'),
      getCount('categories'),
    ]);
    return { posts, pages, categories };
  } catch (error) {
    return { posts: 0, pages: 0, categories: 0 };
  }
};

// GraphQL Fragment for Comments
const COMMENT_FIELDS = gql`
  fragment CommentFields on Comment {
    id
    databaseId
    content
    date
    author {
      node {
        name
        avatar {
          url
        }
      }
    }
    parentId
  }
`;

// Fetch comments for a post
export const getComments = async (wpUrl: string, postId: number): Promise<WPComment[]> => {
  const client = getWPClient(wpUrl);
  const query = gql`
        ${COMMENT_FIELDS}
        query GetComments($postId: Int!) {
            post(id: $postId, idType: DATABASE_ID) {
                comments(first: 100, where: { order: ASC }) {
                    nodes {
                        ...CommentFields
                    }
                }
            }
        }
    `;

  try {
    const data = await client.request<{ post: { comments: { nodes: WPComment[] } } }>(query, { postId });
    return data.post?.comments?.nodes || [];
  } catch (e) {
    console.error('Error fetching comments:', e);
    return [];
  }
};

// Post a comment
export const createComment = async (
  wpUrl: string,
  input: {
    postId: number;
    content: string;
    author: string;
    email: string;
    url?: string;
    parentId?: string;
  }
): Promise<{ success: boolean; message: string; comment?: WPComment }> => {
  const client = getWPClient(wpUrl);
  const mutation = gql`
        mutation CreateComment($input: CreateCommentInput!) {
            createComment(input: $input) {
                success
                comment {
                    id
                    databaseId
                    content
                    date
                    approved
                }
            }
        }
    `;

  try {
    const data = await client.request<any>(mutation, {
      input: {
        commentOn: input.postId,
        content: input.content,
        author: input.author,
        authorEmail: input.email,
        authorUrl: input.url,
        parent: input.parentId ? input.parentId : null,
      }
    });

    if (data.createComment?.success) {
      return { success: true, message: 'Comment submitted successfully', comment: data.createComment.comment };
    }
    return { success: false, message: 'Failed to submit comment' };
  } catch (e: any) {
    console.error('Error creating comment:', e);
    const errorMsg = e.response?.errors?.[0]?.message || e.message || 'Unknown error';
    return { success: false, message: errorMsg };
  }
};

// Submit Contact Form 7
export const submitContactForm7 = async (
  wpUrl: string,
  formId: string,
  formData: FormData
): Promise<{ success: boolean; message: string; invalidFields?: any[] }> => {
  // Construct REST API base URL
  const baseUrl = wpUrl.replace(/\/graphql\/?$/, '').replace(/\/$/, '');
  const endpoint = `${baseUrl}/wp-json/contact-form-7/v1/contact-forms/${formId}/feedback`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (data.status === 'mail_sent') {
      return { success: true, message: data.message };
    } else {
      return { success: false, message: data.message, invalidFields: data.invalid_fields };
    }
  } catch (e: any) {
    console.error('Error submitting CF7:', e);
    return { success: false, message: e.message || 'Error submitting form' };
  }
};

// Fetch ACF Data via REST API
export const getPostAcfData = async (wpUrl: string, postId: number): Promise<Record<string, any> | null> => {

  // Clean up URL to get base
  const baseUrl = wpUrl.replace(/\/graphql\/?$/, '').replace(/\/$/, '');

  try {
    // Fetch only ACF field to minimize payload
    const res = await fetch(`${baseUrl}/wp-json/wp/v2/posts/${postId}?_fields=acf`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!res.ok) return null;

    const data = await res.json();
    // ACF sometimes returns empty array if no fields
    if (Array.isArray(data.acf) && data.acf.length === 0) return null;

    return data.acf || null;
  } catch (error) {
    console.error('Error fetching ACF data:', error);
    return null;
  }
};
