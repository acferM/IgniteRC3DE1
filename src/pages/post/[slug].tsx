import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { useEffect } from 'react';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  nextPost: {
    uid: string;
    title: string;
  };
  previousPost: {
    uid: string;
    title: string;
  };
}

export default function Post({
  post,
  preview,
  nextPost,
  previousPost,
}: PostProps): JSX.Element {
  useEffect(() => {
    const commentDiv = document.getElementsByTagName('div')[0];
    const script = document.createElement('script');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'acferM/IgniteRC3DE1');
    script.setAttribute('issue-term', 'Comment-Issue');
    script.setAttribute('theme', 'github-dark');
    commentDiv.appendChild(script);
  }, []);

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
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </time>
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
          <p>
            {format(
              new Date(
                post.last_publication_date
                  ? post.last_publication_date
                  : post.first_publication_date
              ),
              "'* editado em 'dd MMM yyyy', às 'HH':'MM",
              { locale: ptBR }
            )}
          </p>
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

        <footer className={styles.postFooter}>
          <div>
            <aside className={styles.postPrev}>
              {previousPost && (
                <>
                  <p>{previousPost.title}</p>
                  <Link href={`/post/${previousPost.uid}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </aside>
            <aside className={`${styles.postPrev} ${styles.right}`}>
              {nextPost && (
                <>
                  <p>{nextPost.title}</p>
                  <Link href={`/post/${nextPost.uid}`}>
                    <a>Próximo post</a>
                  </Link>
                </>
              )}
            </aside>
          </div>

          <div />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </footer>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const queryDate = format(
    new Date(response.first_publication_date),
    'yyyy-MM-dd'
  );

  const nextPost = await prismic.query(
    Prismic.Predicates.dayOfMonthAfter(
      'document.first_publication_date',
      new Date(queryDate).getDate() + 1
    ),
    {
      fetch: ['posts.title', 'posts.uid'],
    }
  );

  const previousPost = await prismic.query(
    Prismic.Predicates.dayOfMonthBefore(
      'document.first_publication_date',
      new Date(queryDate).getDate() + 1
    ),
    {
      fetch: ['posts.title', 'posts.uid'],
    }
  );

  const otherPosts = {};

  if (nextPost.results.length > 0) {
    Object.assign(otherPosts, {
      nextPost: {
        uid: nextPost.results[0].uid,
        title: nextPost.results[0].data?.title,
      },
    });
  }

  if (previousPost.results.length > 0) {
    Object.assign(otherPosts, {
      previousPost: {
        uid: previousPost.results[0].uid,
        title: previousPost.results[0].data?.title,
      },
    });
  }

  return {
    props: {
      post: response,
      preview,
      ...otherPosts,
    },
  };
};
