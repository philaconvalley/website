---
title: 'PhilaCon Keyboard Pong'
contributors: ['Diego Mendoza']
description: 'Two-player Pong on one keyboard. Bring a friend and an elbow.'
longDescription: >-
  A two-player version of Pong played on a single keyboard. Each player controls
  a paddle on one side of the screen, moving it up and down to return a ball
  that speeds up as the rally continues. A point is scored when the ball passes
  a paddle. There is no computer opponent — this game requires two people at the
  same keyboard, and it cannot be played with a touchscreen alone.
slug: 'keyboard-pong'
thumbnail: '/images/arcade/keyboard-pong.webp'
thumbnailAlt: 'Two keyboard-shaped paddles, both displaced from center on a dark purple court, with a glowing white ball closing in on one paddle mid-rally.'
ogImage: '/images/arcade/keyboard-pong-og.webp'
marqueeColor: 'purple'
kind: 'game'
input: ['keyboard']
# The game's canvas is 860x500, but the canvas is not the whole document —
# title, scoreboard and the controls legend surround it, and html/body are
# overflow:hidden with no resize handling. This is the *document's* real
# size (measured with Playwright against the standalone game file, viewport
# wide enough not to constrain it), which is what CabinetFrame.astro scales
# to fit. Using the canvas size here clips both paddles and the scoreboard.
fixedSize: { w: 950, h: 740 }
controls:
  - keys: ['W', 'S']
    label: 'Left paddle'
  - keys: ['↑', '↓']
    label: 'Right paddle'
date: 2026-08-01
---

Two players, one keyboard. The oldest argument in video games.
