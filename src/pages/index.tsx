import { useCallback, useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

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
  preview: boolean;
}

export default function Home({
  postsPagination,
  preview,
}: HomeProps): JSX.Element {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadPosts = useCallback(() => {
    fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        const formattedResults = data.results.map(result => {
          const formattedDate = format(
            new Date(result.first_publication_date),
            'dd MMM yyyy',
            { locale: ptBR }
          );

          return {
            ...result,
            first_publication_date: formattedDate,
          };
        });

        setPosts(state => [...state, ...formattedResults]);
        setNextPage(data.next_page);
      });
  }, [nextPage]);

  return (
    <div className={commonStyles.container}>
      <header className={styles.header}>
        <img src="logo.svg" alt="logo" />
      </header>

      <main className={styles.content}>
        {posts.map(post => (
          <div className={styles.post} key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <footer className={styles.info}>
                  <div className={commonStyles.postInfo}>
                    <FiCalendar size={20} color="#BBBBBB" />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM yyyy',
                        { locale: ptBR }
                      )}
                    </time>
                  </div>
                  <div className={commonStyles.postInfo}>
                    <FiUser size={20} color="#BBBBBB" />
                    <p>{post.data.author}</p>
                  </div>
                </footer>
              </a>
            </Link>
          </div>
        ))}

        {nextPage && (
          <button
            type="button"
            onClick={handleLoadPosts}
            className={styles.loadMoreButton}
          >
            Carregar mais posts
          </button>
        )}
      </main>

      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { next_page, results } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.author', 'posts.subtitle'],
      pageSize: 5,
      ref: previewData?.ref ?? null,
    }
  );

  const formattedResults = results.map(
    ({ uid, first_publication_date, data }) => {
      return {
        uid,
        first_publication_date,
        data,
      };
    }
  );

  return {
    props: {
      postsPagination: {
        next_page,
        results: formattedResults,
      },
      preview,
    },
  };
};
