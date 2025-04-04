## 概述

该目录下按章节存放英文原文，确保和中文翻译的章节标号一致。

## 添加方式

添加新英文章节：
- 在 `books_en/0{当前卷号}/text_en.md` 结尾按 Markdown 格式添加新章节
- 运行 `split_chapters.py` 脚本，生成新章节

添加新英文卷：
- 在 `books_en/` 目录下创建新文件夹，例如 `05`
- 在 `05/text_en.md` 中按 Markdown 格式添加新卷内容
- 运行 `split_chapters.py` 脚本，生成新卷

Markdown 格式的文本可从 AO3 下载 EPUB 后转换为 Markdown 格式得到。转换后的无用格式信息 `split_chapters.py` 会自动去除。