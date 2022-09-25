import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
// @ts-expect-error
import Readme from './_index.md'

import styles from './index.module.css'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <div className={styles.box}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p style={{ fontSize: 16 }}>{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/books/01/">
              阅读
            </Link>
          </div>
        </div>
      </header>
    </div>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout>
      <HomepageHeader />
      <main className={'container padding-top--md padding-bottom--lg'}>
        <Readme />
      </main>
    </Layout>
  )
}
