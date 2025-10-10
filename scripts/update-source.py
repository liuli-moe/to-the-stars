#!/usr/bin/env python3
"""
AO3章节下载脚本
提取指定内容并转换为Markdown格式
"""

import requests
import os
import re
import time
import random
from bs4 import BeautifulSoup
from pathlib import Path

# 配置
WORK_BASE_URL = "https://archiveofourown.org/works/777002/chapters/"
OUTPUT_DIR = "./en-US"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# 创建会话
session = requests.Session()
session.headers.update({
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Connection": "keep-alive",
})

def fetch_chapter_ids():
    """从章节页面获取所有章节ID"""
    try:
        # 使用第一个章节的URL来获取章节选择器
        first_chapter_url = "https://archiveofourown.org/works/777002/chapters/1461984"
        
        print("获取章节列表...")
        response = retry_request(first_chapter_url)
        html_content = response.text
        
        # 解析HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 查找章节选择器
        select_tag = soup.find('select', {'name': 'selected_id', 'id': 'selected_id'})
        if not select_tag:
            print("未找到章节选择器")
            return []
        
        # 提取所有option标签的value值
        chapter_ids = []
        option_tags = select_tag.find_all('option')
        
        for option in option_tags:
            value = option.get('value')
            if value:
                chapter_ids.append(value)
                print(f"  找到章节: {value} - {option.get_text(strip=True)}")
        
        print(f"成功获取 {len(chapter_ids)} 个章节ID")
        return chapter_ids
        
    except Exception as e:
        print(f"获取章节ID失败: {e}")
        return []

def retry_request(url, max_retries=5, delay=2):
    """带重试的请求函数"""
    for attempt in range(max_retries):
        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"  请求失败 (尝试 {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                sleep_time = delay * (2 ** attempt) + random.uniform(0, 1)
                print(f"  等待 {sleep_time:.1f} 秒后重试...")
                time.sleep(sleep_time)
            else:
                raise e

def extract_title(html_content):
    """从HTML中提取标题 - 直接定位h3.title标签"""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # 直接查找<h3 class="title">标签
        title_h3 = soup.find('h3', class_='title')
        if not title_h3:
            print("  未找到<h3 class='title'>标签")
            return "未知标题"
        
        # 提取a标签中的内容（如"Chapter 1"）
        a_tag = title_h3.find('a')
        chapter_part = a_tag.get_text(strip=True) if a_tag else ""
        
        # 提取h3标签中除了a标签以外的所有文本内容
        h3_copy = BeautifulSoup(str(title_h3), 'html.parser').find('h3', class_='title')
        # 移除a标签
        if a_tag:
            a_tag_copy = h3_copy.find('a')
            if a_tag_copy:
                a_tag_copy.extract()
        
        # 获取剩余文本
        rest_text = h3_copy.get_text(strip=True)
        
        # 清理文本：移除开头的冒号和空格
        rest_text = re.sub(r'^:\s*', '', rest_text)
        
        # 将半角冒号替换为全角冒号
        rest_text = rest_text.replace(": ", "：")
        
        # 组合标题
        if chapter_part and rest_text:
            title = f"{chapter_part}-{rest_text}"
        elif chapter_part:
            title = chapter_part
        elif rest_text:
            title = rest_text
        else:
            title = "未知标题"
            
        return title
        
    except Exception as e:
        print(f"  提取标题失败: {e}")
        return "未知标题"

def extract_main_content(html_content):
    """提取<!--main content-->到<!--/main-->之间的内容"""
    try:
        # 使用正则表达式提取指定注释之间的内容
        pattern = r'<!--main content-->(.*?)<!--/main-->'
        match = re.search(pattern, html_content, re.DOTALL)
        
        if match:
            return match.group(1).strip()
        else:
            print("  未找到<!--main content-->到<!--/main-->之间的内容")
            return None
    except Exception as e:
        print(f"  提取主要内容失败: {e}")
        return None

def html_to_markdown(html_content):
    """使用markdownify将HTML转换为Markdown，并处理特殊情况"""
    try:
        import markdownify as md
        
        # 删除HTML中的sup标签可能的换行，注意不同系统正则表达式可能不同
        soup = re.sub('[\s\n]+<sup>','<sup>',html_content)
        # 保护sup标签
        soup = soup.replace('<sup>','sup-start')
        soup = soup.replace('</sup>','sup-end')

        # 将处理后的HTML转换回字符串
        processed_html = str(soup)
        
        # 使用markdownify转换，设置heading_style为ATX（使用#号）
        markdown = md.markdownify(processed_html, heading_style="ATX")
        
        # 手动确保分隔线格式正确
        markdown = re.sub(r'^\*{3,}$', '---', markdown, flags=re.MULTILINE)
        
        #将sup标签还原
        markdown = markdown.replace('sup-start','<sup>')
        markdown = markdown.replace('sup-end','</sup>')

        return markdown
        
    except ImportError:
        print("  错误: 未安装markdownify库，请运行: pip install markdownify")
        return "转换失败，请安装markdownify库"
    except Exception as e:
        print(f"  HTML转Markdown失败: {e}")
        return "转换失败"

def sanitize_filename(filename):
    """清理文件名"""
    # 移除非法字符
    cleaned = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # 替换多个空格为单个空格
    cleaned = re.sub(r'\s+', ' ', cleaned)
    # 限制长度
    return cleaned.strip()[:100]

def download_chapter_markdown(chapter_id, chapter_number, output_dir):
    """下载单个章节并转换为Markdown"""
    print(f"\n--- 处理章节 {chapter_number}: {chapter_id} ---")
    
    try:
        chapter_url = f"{WORK_BASE_URL}{chapter_id}"
        
        # 下载HTML内容
        print("  下载HTML内容...")
        response = retry_request(chapter_url)
        html_content = response.text
        
        # 提取标题
        print("  提取标题...")
        title = extract_title(html_content)
        safe_title = sanitize_filename(title)
        print(f"  章节标题: '{title}'")
        
        # 提取主要内容
        print("  提取主要内容...")
        main_content_html = extract_main_content(html_content)
        
        if not main_content_html:
            print("  ✗ 无法提取主要内容")
            return False
        
        # 转换为Markdown
        print("  转换为Markdown...")
        markdown_content = html_to_markdown(main_content_html)
        
        # 生成文件名
        filename = f"{chapter_number}-{safe_title}.md"
        filepath = os.path.join(output_dir, filename)
        
        # 写入文件
        print(f"  保存文件: {filename}")
        with open(filepath, 'w', encoding='utf-8',newline='\n') as f:
            f.write(f"# {title}\n\n")
            f.write("---\n\n")
            f.write(markdown_content)
        
        print(f"  ✓ 成功保存: {filename}")
        return True
        
    except Exception as e:
        print(f"  ✗ 处理章节 {chapter_id} 失败: {e}")
        return False

def main():
    """主函数"""
    print("AO3章节Markdown下载器")
    print("=" * 50)
    
    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"输出目录: {OUTPUT_DIR}")
    
    # 读取章节列表
    try:
        chapter_ids = fetch_chapter_ids()
        print(f"找到 {len(chapter_ids)} 个章节需要下载")
        
        if not chapter_ids:
            print("❌ list.txt 中没有找到有效的章节ID")
            return
            
    except Exception as e:
        print(f"❌ 读取章节列表失败: {e}")
        return
    
    success_count = 0
    error_count = 0
    failed_chapters = []
    
    # 处理每个章节
    for i, chapter_id in enumerate(chapter_ids, 1):
        chapter_number = str(i).zfill(3)
        
        success = download_chapter_markdown(chapter_id, chapter_number, OUTPUT_DIR)
        
        if success:
            success_count += 1
        else:
            error_count += 1
            failed_chapters.append(chapter_id)
        
        # 添加延迟，避免请求过快
        if i < len(chapter_ids):
            delay = random.uniform(2, 4)  # 2-4秒随机延迟
            print(f"  等待 {delay:.1f} 秒...")
            time.sleep(delay)
    
    # 输出总结
    print("\n" + "=" * 50)
    print(f"下载完成: {success_count} 成功, {error_count} 失败")
    
    if failed_chapters:
        print(f"\n失败的章节: {', '.join(failed_chapters)}")
        
        # 保存失败列表
        failed_file = os.path.join(OUTPUT_DIR, "failed-chapters.txt")
        with open(failed_file, 'w', encoding='utf-8') as f:
            for chapter_id in failed_chapters:
                f.write(f"{chapter_id}\n")
        print(f"失败章节列表已保存到: {failed_file}")
    
    if success_count > 0:
        print(f"\n✓ 成功下载 {success_count} 个Markdown文件到: {OUTPUT_DIR}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠ 脚本被用户中断")
    except Exception as e:
        print(f"\n❌ 脚本执行失败: {e}")