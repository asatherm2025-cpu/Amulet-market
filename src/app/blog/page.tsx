'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, Tag, ChevronRight } from 'lucide-react'
import { BLOG_POSTS } from '@/lib/blog-data'

export default function BlogPage() {


  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      {/* Header */}
      <div className="dark-gradient text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-400 text-sm font-semibold tracking-widest uppercase mb-3">
            📚 บทความ &amp; ความรู้
          </p>
          <h1 className="text-4xl sm:text-5xl font-black text-[#F0D080] mb-4">
            SIAM COIN <span className="text-white">Journal</span>
          </h1>
          <p className="text-yellow-200/70 text-lg max-w-xl mx-auto">
            ความรู้ เรื่องราว และมุมมองจากวงการพระเครื่องไทย
          </p>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {BLOG_POSTS.map(post => (
          <article key={post.id} className="bg-white rounded-3xl border border-yellow-100 shadow-sm overflow-hidden card-hover group">
            <Link href={`/blog/${post.slug}`} className="flex flex-col sm:flex-row">
              {/* Cover image */}
              {post.coverImage && (
                <div className="relative sm:w-72 h-52 sm:h-auto shrink-0 bg-yellow-50 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, 288px"
                  />
                  {/* Category badge */}
                  <span className="absolute top-3 left-3 bg-[#1A1208]/80 text-[#F0D080] text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    {post.category}
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full">
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3 leading-tight group-hover:text-[#8B6914] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(post.publishedAt).toLocaleDateString('th-TH', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {post.readMinutes} นาที
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#C9A84C] flex items-center gap-1 group-hover:gap-2 transition-all">
                    อ่านต่อ <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}

        {/* Empty state */}
        {BLOG_POSTS.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p>ยังไม่มีบทความ</p>
          </div>
        )}
      </div>
    </div>
  )
}
