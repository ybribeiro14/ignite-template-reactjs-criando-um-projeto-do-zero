import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';
import commonStyles from '../styles/common.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  useEffect(() => {
    const postUpdateDate = posts.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'PP',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts(postUpdateDate);
  }, []);

  async function handlePagination() {
    const response = await fetch(`${nextPage}`);

    const postsResults = await response.json();
    const newPosts: Post[] = postsResults.results.map(post => {
      return {
        ...post,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'PP',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setNextPage(postsResults.next_page);
    setPosts([...posts, ...newPosts]);
  }

  return (
    <>
      <Head>
        <title>Posts | Blog Ignite</title>
      </Head>
      <main className={styles.contentContainer}>
        <div className={styles.posts}>
          {posts.map(post => (
            <Link key={post.uid} href={`post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.infos}>
                  <div>
                    <AiOutlineCalendar />
                    <time>{post.first_publication_date}</time>
                  </div>

                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage ? (
          <button
            className={styles.buttonPagination}
            type="submit"
            onClick={handlePagination}
          >
            Carregar mais posts
          </button>
        ) : (
          ''
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  return {
    props: {
      postsPagination: {
        next_page: response.next_page,
        results: response.results,
      },
    },
  };
};
