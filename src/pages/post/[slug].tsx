import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { AiOutlineCalendar, AiOutlineClockCircle } from 'react-icons/ai';
import { FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const [readindTime, setReadindTime] = useState(0);
  const [postUpdated, setPostUpdated] = useState<Post>(post);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  useEffect(() => {
    if (post) {
      const readindTimeClac = post.data.content.reduce((acc, obj) => {
        const bodyText = RichText.asText(obj.body);
        const textLength = bodyText.split(/\s/g).length;
        const time = Math.ceil(textLength / 200);

        return acc + time;
      }, 0);

      setReadindTime(readindTimeClac);

      const content = post.data.content.map(item => ({
        ...item,
        body: RichText.asHtml(item.body),
      }));

      const postUpdate: Post = post;

      postUpdate.data.content = content;

      setPostUpdated(postUpdate);
    }
  }, [post]);

  return (
    <>
      <Head>
        <title>Post | Blog Ignite</title>
      </Head>
      <main className={styles.contentContainer}>
        <img
          src={post.data.banner.url}
          alt="banner"
          className={styles.banner}
        />
        <div className={styles.post}>
          <strong>{post.data.title}</strong>
          <div className={commonStyles.infos}>
            <div>
              <AiOutlineCalendar />
              <time>
                {format(new Date(post.first_publication_date), 'PP', {
                  locale: ptBR,
                })}
              </time>
            </div>

            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>

            <div>
              <AiOutlineClockCircle />
              <span>{readindTime} min</span>
            </div>
          </div>
        </div>
        {post.data.content.map(content => (
          <div key={content.heading} className={styles.postContent}>
            <strong>{content.heading}</strong>
            <div dangerouslySetInnerHTML={{ __html: content.body }} />
          </div>
        ))}
      </main>
      )
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
    }
  );

  const paths = response.results.map(result => {
    return {
      params: { slug: result.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = response;

  // const content = response.data.content.map(item => ({
  //   ...item,
  //   body: RichText.asHtml(item.body),
  // }));

  // post.data.content = content;

  return {
    props: {
      post,
    },
    revalidate: 60 * 48,
  };
};
