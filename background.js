/* BCH Tips background.js */

// tries to send up to 250 queued tips every hour (limit to 100 to save $)
// random up to 100s offset to reduce load on my server / app
// consider large json file with all addresses hosted on s3, or one file per user on s3 e.g. r-bchtips.txt, cloudflare it!

// 8-14s between two web requests to profile page and bchtips database

// todo: use alarms/events and just use background to make sure the alarm thing is working
// scans for wallet fundings every 1m so it can push some speech and a notification when detected