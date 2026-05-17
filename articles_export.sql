--
-- PostgreSQL database dump
--

\restrict euMBi46FdroCIVpl7AafNkc6ee8JhOHby4JQcUxOxEklDqgPgp5scuspfZriSr5

-- Dumped from database version 14.19 (Homebrew)
-- Dumped by pg_dump version 14.19 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Article; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Article" (id, title, slug, excerpt, content, published, "createdAt", "updatedAt") VALUES (2, 'The Research Behind the Story', 'the-research-behind-the-story', 'Here is what I discovered about "Will"!', '## Where the Thought Began

There has been many times in life where my choices have landed me in spaces that I did not belong in. Most of the time I was being influenced by those who I was the closest to. What I failed to realize is that they would not be able to see the vision for my life because their default was "Safe". I always questioned myself because I knew that God has given me talents that I was not utilizing the way he would want me to. As I look back at my life, I do not have any regrets but I often think what if I would have believed in myself sooner, "What would life be like"!. Have you ever asked that question? If you have not, make sure that you ask yourself that question for the future. What if I believe in myself to take the steps even if there is not a guarantee that I will succeed. I rather have that as a product of me moving forward than it become a question I wrestle with toward the end of my days.

## Unexpected Discoveries

The most interesting findings are always the ones you weren''t looking for...

## How Research Shapes Story

Facts constrain and liberate simultaneously. Every real detail grounds the narrative in something larger than invention.', true, '2026-03-01 07:47:45.158', '2026-04-03 02:44:48.084');
INSERT INTO public."Article" (id, title, slug, excerpt, content, published, "createdAt", "updatedAt") VALUES (1, 'Why I Wrote This Book', 'why-i-wrote-this-book', 'Every book starts with a question that won''t leave you alone. This is the story of mine.', '## The Question That Started It All

Some ideas refuse to let go. For years, the concept behind this book lived rent-free in my mind...

## The Writing Process

Writing a book is an act of sustained obsession. You have to believe, against all evidence some days, that the story matters enough to tell.

## What I Hope You Take Away

If you walk away with one thing, I hope it''s this: [key insight placeholder].', true, '2026-03-01 07:47:45.152', '2026-04-04 18:26:24.772');


--
-- Name: Article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Article_id_seq"', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict euMBi46FdroCIVpl7AafNkc6ee8JhOHby4JQcUxOxEklDqgPgp5scuspfZriSr5

