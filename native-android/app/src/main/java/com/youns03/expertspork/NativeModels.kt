package com.youns03.expertspork

data class WordTiming(
    val id: String,
    val text: String,
    val start: Double,
    val end: Double
)

data class SentenceItem(
    val id: String,
    val text: String,
    val start: Double,
    val end: Double,
    val words: List<WordTiming>
)

data class TranscriptionResult(
    val title: String,
    val language: String,
    val direction: String,
    val duration: Double,
    val sentences: List<SentenceItem>
)
