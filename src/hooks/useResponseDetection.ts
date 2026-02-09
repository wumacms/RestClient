import React, { useMemo } from 'react';
import { ApiResponse } from '../types';

export const useResponseDetection = (response: ApiResponse | null) => {
  const contentType = response?.contentType?.toLowerCase() || '';

  const isImage = contentType.startsWith('image/');
  const isAudio = contentType.startsWith('audio/');
  const isVideo = contentType.startsWith('video/');
  const isBlob = response?.data instanceof Blob;

  const isHtml = useMemo(() => {
    return contentType.includes('html') ||
      (response?.data &&
        typeof response.data === 'string' &&
        /^\s*(<!DOCTYPE html>|<html)/i.test(response.data))
      ? true
      : false;
  }, [contentType, response?.data]);

  const isMarkdown = useMemo(() => {
    if (isHtml) return false;
    return contentType.includes('markdown') ||
      (response?.data &&
        typeof response.data === 'string' &&
        (response.data.includes('# ') || response.data.includes('**')))
      ? true
      : false;
  }, [contentType, response?.data, isHtml]);

  const isJson = useMemo(() => {
    if (contentType.includes('application/json')) return true;
    if (response?.data && typeof response.data === 'string' && !isHtml && !isMarkdown) {
      try {
        const trimmed = response.data.trim();
        if (
          (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))
        ) {
          JSON.parse(trimmed);
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    return false;
  }, [contentType, response, isHtml, isMarkdown]);

  return {
    contentType,
    isImage,
    isAudio,
    isVideo,
    isBlob,
    isHtml,
    isMarkdown,
    isJson
  };
};
