package com.youns03.expertspork

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class NativeProjectStore(context: Context) {
    private val preferences = context.getSharedPreferences("expert_spork_native", Context.MODE_PRIVATE)
    private val key = "projects"

    fun list(): List<NativeProject> = runCatching {
        val array = JSONArray(preferences.getString(key, "[]"))
        buildList {
            for (i in 0 until array.length()) add(decodeProject(array.getJSONObject(i)))
        }.sortedByDescending { it.createdAt }
    }.getOrDefault(emptyList())

    fun save(project: NativeProject) {
        val projects = list().filterNot { it.id == project.id }.toMutableList()
        projects.add(0, project)
        preferences.edit().putString(key, JSONArray().apply {
            projects.forEach { put(encodeProject(it)) }
        }.toString()).apply()
    }

    fun delete(id: String) {
        val remaining = list().filterNot { it.id == id }
        preferences.edit().putString(key, JSONArray().apply {
            remaining.forEach { put(encodeProject(it)) }
        }.toString()).apply()
    }

    private fun encodeProject(project: NativeProject) = JSONObject().apply {
        put("id", project.id)
        put("title", project.title)
        put("createdAt", project.createdAt)
        put("mimeType", project.mimeType)
        put("audioPath", project.audioPath)
        put("transcription", encodeTranscription(project.transcription))
    }

    private fun encodeTranscription(result: TranscriptionResult) = JSONObject().apply {
        put("title", result.title)
        put("language", result.language)
        put("direction", result.direction)
        put("duration", result.duration)
        put("sentences", JSONArray().also { array ->
            result.sentences.forEach { sentence ->
                array.put(JSONObject().apply {
                    put("id", sentence.id)
                    put("text", sentence.text)
                    put("start", sentence.start)
                    put("end", sentence.end)
                    put("words", JSONArray().also { words ->
                        sentence.words.forEach { word ->
                            words.put(JSONObject().apply {
                                put("id", word.id)
                                put("text", word.text)
                                put("start", word.start)
                                put("end", word.end)
                            })
                        }
                    })
                })
            }
        })
    }

    private fun decodeProject(data: JSONObject): NativeProject = NativeProject(
        id = data.optString("id"),
        title = data.optString("title", "Untitled"),
        createdAt = data.optString("createdAt"),
        mimeType = data.optString("mimeType", "audio/mp3"),
        audioPath = data.optString("audioPath"),
        transcription = decodeTranscription(data.getJSONObject("transcription"))
    )

    private fun decodeTranscription(data: JSONObject): TranscriptionResult {
        val sentenceArray = data.optJSONArray("sentences") ?: JSONArray()
        val sentences = buildList {
            for (i in 0 until sentenceArray.length()) {
                val sentence = sentenceArray.getJSONObject(i)
                val wordsArray = sentence.optJSONArray("words") ?: JSONArray()
                val words = buildList {
                    for (j in 0 until wordsArray.length()) {
                        val word = wordsArray.getJSONObject(j)
                        add(WordTiming(word.optString("id", "w-$i-$j"), word.optString("text"), word.optDouble("start"), word.optDouble("end")))
                    }
                }
                add(SentenceItem(sentence.optString("id", "s-$i"), sentence.optString("text"), sentence.optDouble("start"), sentence.optDouble("end"), words))
            }
        }
        return TranscriptionResult(data.optString("title", "Transcription"), data.optString("language", "auto"), data.optString("direction", "ltr"), data.optDouble("duration"), sentences)
    }
}
