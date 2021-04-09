import { GetStaticPaths, GetStaticProps } from 'next';
import Prismic from '@prismicio/client';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { formatDate } from '../../utils/formatDate';

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
  timeToRead: number;
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <p>Carregando...</p>;
  }

  const wordsCount = post.data.content
    .map(content => {
      const textCount = content.body.reduce((acc, b) => {
        const words = b.text.split(' ').length;

        return acc + words;
      }, 0);

      return textCount;
    })
    .reduce((acc, wordCount) => acc + wordCount, 0);

  const timeToRead = Math.ceil(wordsCount / 200);

  return (
    <>
      <Header />

      <img
        className={styles.banner}
        src={post.data.banner.url}
        alt={post.data.title}
      />

      <main className={commonStyles.container}>
        <div className={styles.postTop}>
          <h1>{post.data.title}</h1>

          <ul className={styles.postInfoList}>
            <li>
              <FiCalendar size={20} color="#BBBBBB" />
              <time>{formatDate(post.first_publication_date)}</time>
            </li>
            <li>
              <FiUser size={20} color="#BBBBBB" />
              <p>{post.data.author}</p>
            </li>
            <li>
              <FiClock size={20} color="#BBBBBB" />
              <time>{`${timeToRead} min`}</time>
            </li>
          </ul>
        </div>

        {post.data.content.map(content => (
          <section key={content.heading} className={styles.postSection}>
            <h1>{`${content.heading}\n`}</h1>
            <main>
              {content.body.map(b => (
                <p key={b.text}>{b.text}</p>
              ))}
            </main>
          </section>
        ))}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
