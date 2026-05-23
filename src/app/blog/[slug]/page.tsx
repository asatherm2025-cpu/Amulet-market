'use client'
import { use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Calendar, Clock, Tag, ChevronLeft, BookOpen } from 'lucide-react'
import { getBlogPost, BLOG_POSTS } from '@/lib/blog-data'

// Simple markdown-like renderer
function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={key++} className="text-2xl font-black text-gray-900 mt-10 mb-4 pb-2 border-b border-yellow-200">
          {line.replace('## ', '')}
        </h2>
      )
    } else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={key++} className="border-l-4 border-[#C9A84C] pl-5 py-1 my-6 bg-yellow-50/60 rounded-r-xl italic text-gray-700 text-lg">
          {line.replace('> ', '')}
        </blockquote>
      )
    } else if (line.startsWith('- ')) {
      elements.push(
        <li key={key++} className="flex items-start gap-2 text-gray-700 mb-1.5 ml-2">
          <span className="text-[#C9A84C] mt-1 shrink-0">●</span>
          {line.replace('- ', '')}
        </li>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="h-2" />)
    } else {
      elements.push(
        <p key={key++} className="text-gray-700 leading-relaxed text-base sm:text-lg">
          {line}
        </p>
      )
    }
  }

  return elements
}

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const post = getBlogPost(slug)

  if (!post) notFound()

  const related = BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      {/* Hero */}
      {post.coverImage && (
        <div className="relative h-64 sm:h-96 bg-[#1A1208] overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover opacity-60"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1208] via-transparent to-transparent" />
          <div className="absolute bottom-6 left-4 right-4 max-w-3xl mx-auto">
            <span className="inline-block bg-[#C9A84C] text-[#1A1208] text-xs font-black px-3 py-1 rounded-full mb-3">
              {post.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#8B6914] mb-6 transition-colors">
          <ChevronLeft size={16} />
          กลับไปหน้าบทความ
        </Link>

        {/* Title (if no hero image) */}
        {!post.coverImage && (
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-6 leading-tight">
            {post.title}
          </h1>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 pb-6 border-b border-yellow-100">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-xs font-black text-[#1A1208]">
              {post.author[0]}
            </div>
            <span className="text-gray-600 font-medium">{post.author}</span>
          </div>
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            {new Date(post.publishedAt).toLocaleDateString('th-TH', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={13} />
            อ่าน {post.readMinutes} นาที
          </span>
          <span className="flex items-center gap-1">
            <BookOpen size={13} />
            {post.content.split(' ').length} คำ
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-8">
          {post.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1 rounded-full font-medium">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        {/* Excerpt / Lead */}
        <p className="text-lg sm:text-xl text-gray-600 leading-relaxed font-medium italic border-l-4 border-[#C9A84C] pl-4 mb-8 bg-yellow-50/50 py-3 rounded-r-xl">
          {post.excerpt}
        </p>

        {/* Content */}
        <div className="space-y-4 prose-like">
          {renderContent(post.content)}
        </div>

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-yellow-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">แชร์บทความนี้</p>
            <div className="flex gap-2">
              {[
                { label: 'Facebook', color: 'bg-blue-600', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}` },
                { label: 'LINE', color: 'bg-green-500', href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}` },
                { label: 'X', color: 'bg-gray-900', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(post.title)}` },
              ].map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${s.color} text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity`}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <Link href="/market">
            <button className="gold-gradient text-[#1A1208] font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              🪙 ดูเหรียญในตลาด
            </button>
          </Link>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-black text-gray-900 mb-6">บทความที่เกี่ยวข้อง</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group bg-white rounded-2xl border border-yellow-100 overflow-hidden hover:border-yellow-300 hover:shadow-md transition-all">
                  {r.coverImage && (
                    <div className="relative h-32 bg-yellow-50">
                      <Image src={r.coverImage} alt={r.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="200px" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-[#8B6914] transition-colors">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock size={10} /> {r.readMinutes} นาที
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
