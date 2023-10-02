/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable node/no-missing-import */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-undef */
// TODO: migrate to ts; Im working with data.ts.template but doing a poor job.

import { extractSongName } from './re';
import bfetch from './BiliFetch';
import { logger } from './Logger';

/**
 *  LRC Mapping
 */
const URL_LRC_MAPPING =
  'https://raw.githubusercontent.com/kenmingwang/azusa-player-lrcs/main/mappings.txt';
/**
 *  LRC Base
 */
const URL_LRC_BASE =
  'https://raw.githubusercontent.com/kenmingwang/azusa-player-lrcs/main/{songFile}';
/**
 *  QQ SongSearch API POST
 */
const URL_QQ_SEARCH_POST = {
  src: 'https://u.y.qq.com/cgi-bin/musicu.fcg',
  params: {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    referrer: 'https://u.qq.com/',
    body: {
      comm: {
        ct: '19',
        cv: '1859',
        uin: '0',
      },
      req: {
        method: 'DoSearchForQQMusicDesktop',
        module: 'music.search.SearchCgiService',
        param: {
          grp: 1,
          num_per_page: 10,
          page_num: 1,
          query: '',
          search_type: 0,
        },
      },
    },
  },
};

/**
 *  QQ LyricSearchAPI
 */
const URL_QQ_LYRIC =
  'https://i.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid={SongMid}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&nobase64=1';

// Refactor needed for this func
export const fetchLRC = async (name, setLyric, setSongTitle) => {
  // logger.log('Data.js Calling: fetchLRC')
  // Get song mapping name and song name from title
  const res = await bfetch(URL_LRC_MAPPING);
  const mappings = await res.text();
  const songs = mappings.split('\n');
  const songName = extractSongName(name);
  setSongTitle(songName);

  const songFile = songs.find(v => v.includes(songName));
  // use song name to get the LRC
  try {
    const lrc = await bfetch(URL_LRC_BASE.replace('{songFile}', songFile));
    if (lrc.status !== '200') {
      setLyric('[00:00.000] 无法找到歌词');
      return;
    }

    const text = await lrc.text();
    setLyric(text.replaceAll('\r\n', '\n'));
    return text.replaceAll('\r\n', '\n');
  } catch (error) {
    setLyric('[00:00.000] 无法找到歌词');
  }
};

export const searchLyricOptions = async searchKey => {
  if (!searchKey) {
    throw new Error('Search key is required');
  }
  logger.info(`calling searchLyricOptions: ${searchKey}`);
  const API = getQQSearchAPI(searchKey);
  const res = await bfetch(API.src, API.params);
  const json = await res.json();
  console.debug(json);
  const data = json.req.data.body.song.list;
  return data.map((s, v) => ({
    key: s.mid,
    songMid: s.mid,
    label: `${v}. ${s.name} / ${s.singer[0].name}`,
  }));
};

const getQQSearchAPI = searchKey => {
  const API = JSON.parse(JSON.stringify(URL_QQ_SEARCH_POST));
  API.params.body.req.param.query = searchKey;
  API.params.body = JSON.stringify(API.params.body);
  return API;
};

export const searchLyric = async (searchMID, setLyric) => {
  logger.info('calling searchLyric');
  const res = await bfetch(URL_QQ_LYRIC.replace('{SongMid}', searchMID));
  const json = await res.json();
  if (!json.lyric) {
    setLyric('[00:00.000] 无法找到歌词,请手动搜索');
    return;
  }

  let finalLrc = json.lyric;

  // Merge trans Lyrics
  if (json.trans) {
    finalLrc = `${json.trans}\n${finalLrc}`;
  }
  // logger.log(finalLrc)
  setLyric(finalLrc);
};
