export interface IBlog {
  id?: string;
  title: string;
  content: string;
  image?: string;
  category?: string;
  tags?: string[];
  views?: number;
  isPublished?: boolean;
  authorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type IBlogFilterRequest = {
  searchTerm?: string | undefined;
  category?: string | undefined;
  authorId?: string | undefined;
  isPublished?: string | boolean | undefined;
};
