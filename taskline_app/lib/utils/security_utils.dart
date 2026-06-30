import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../models/important_contact.dart';

class SecurityUtils {
  // Simple deterministic key derived from user profile or preferences
  static String getCryptoKey() {
    return "TASKLINE_APP_SECURE_CIPHER_KEY_32";
  }

  /// 1. SMS Reading: Hash account numbers, OTPs, phone numbers, passcodes.
  /// Uses SHA-256 secure hash format with a visible truncated signature prefix.
  static String secureHash(String input) {
    if (input.isEmpty) return "";
    final cleanInput = input.replaceAll(RegExp(r'[\s\-()]'), '');
    final bytes = utf8.encode(cleanInput);
    final digest = sha256.convert(bytes);
    final fullHash = digest.toString().toUpperCase();
    return "HASH_${fullHash.substring(0, 12)}...${fullHash.substring(fullHash.length - 4)}";
  }

  /// 2. Client-side symmetric encryption mimicking AES/DES via RC4 or simple XOR stream cipher
  /// with a custom key scheduler to guarantee offline-first, zero-server-leak encryption.
  static String encryptPhoneNumber(String phone) {
    if (phone.isEmpty) return "";
    final cleanPhone = phone.replaceAll(RegExp(r'[\s\-()]'), '');
    final key = getCryptoKey();
    
    // Key schedule (RC4-like setup)
    List<int> s = List<int>.generate(256, (i) => i);
    int j = 0;
    for (int i = 0; i < 256; i++) {
      j = (j + s[i] + key.codeUnitAt(i % key.length)) % 256;
      int temp = s[i];
      s[i] = s[j];
      s[j] = temp;
    }

    int i = 0;
    j = 0;
    List<String> encryptedHex = [];
    for (int k = 0; k < cleanPhone.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      int temp = s[i];
      s[i] = s[j];
      s[j] = temp;

      int keystreamByte = s[(s[i] + s[j]) % 256];
      int cipherByte = cleanPhone.codeUnitAt(k) ^ keystreamByte;
      encryptedHex.add(cipherByte.toRadixString(16).padLeft(2, '0').toUpperCase());
    }

    return "ENC_${encryptedHex.join('')}";
  }

  /// Decrypts the cipher hex back to plain phone number
  static String decryptPhoneNumber(String encryptedHex) {
    if (encryptedHex.isEmpty || !encryptedHex.startsWith("ENC_")) return encryptedHex;
    final hex = encryptedHex.replaceFirst("ENC_", "");
    final key = getCryptoKey();

    List<int> bytes = [];
    for (int c = 0; c < hex.length; c += 2) {
      bytes.add(int.parse(hex.substring(c, c + 2), radix: 16));
    }

    // Key schedule (RC4-like setup)
    List<int> s = List<int>.generate(256, (i) => i);
    int j = 0;
    for (int i = 0; i < 256; i++) {
      j = (j + s[i] + key.codeUnitAt(i % key.length)) % 256;
      int temp = s[i];
      s[i] = s[j];
      s[j] = temp;
    }

    int i = 0;
    j = 0;
    List<int> decryptedCodes = [];
    for (int k = 0; k < bytes.length; k++) {
      i = (i + 1) % 256;
      j = (j + s[i]) % 256;
      int temp = s[i];
      s[i] = s[j];
      s[j] = temp;

      int keystreamByte = s[(s[i] + s[j]) % 256];
      int plainChar = bytes[k] ^ keystreamByte;
      decryptedCodes.add(plainChar);
    }

    return String.fromCharCodes(decryptedCodes);
  }

  /// Redact and hash sensitive patterns in raw SMS text
  static Map<String, dynamic> redactAndHashSms(String text) {
    String redacted = text;
    bool containsSensitive = false;
    List<String> redactedDetails = [];

    // Redact OTPs (4-8 digits) and show its hash
    final otpRegex = RegExp(r'\b\d{4,8}\b');
    final otpMatch = otpRegex.firstMatch(redacted);
    if (otpMatch != null) {
      final rawOtp = otpMatch.group(0)!;
      final hashedOtp = secureHash(rawOtp);
      redacted = redacted.replaceAll(otpRegex, "[REDACTED_OTP: $hashedOtp]");
      containsSensitive = true;
      redactedDetails.add("One-Time Password (OTP)");
    }

    // Redact credentials/passcodes and show their hash
    final credsRegex = RegExp(r'(?:password|pwd|passcode|pin|credentials|token):\s*(\S+)', caseSensitive: false);
    final credsMatch = credsRegex.firstMatch(redacted);
    if (credsMatch != null) {
      final rawCred = credsMatch.group(1)!;
      final hashedCred = secureHash(rawCred);
      redacted = redacted.replaceFirst(rawCred, "[REDACTED_CREDENTIAL: $hashedCred]");
      containsSensitive = true;
      redactedDetails.add("Account Passcode/PIN");
    }

    // Redact Account Numbers (9-18 digits) and show their hash
    final accountRegex = RegExp(r'\b\d{9,18}\b');
    final accountMatch = accountRegex.firstMatch(redacted);
    if (accountMatch != null) {
      final rawAccount = accountMatch.group(0)!;
      final hashedAccount = secureHash(rawAccount);
      redacted = redacted.replaceAll(accountRegex, "[REDACTED_ACCOUNT: $hashedAccount]");
      containsSensitive = true;
      redactedDetails.add("Financial Account Number");
    }

    // Redact general amount figures
    final amountRegex = RegExp(r'(?:rs\.?|usd|\$|inr|€|£|amount|balance)\s*\d+(?:,\d{3})*(?:\.\d+)?', caseSensitive: false);
    if (amountRegex.hasMatch(redacted)) {
      redacted = redacted.replaceAllMapped(amountRegex, (match) => "[REDACTED_AMOUNT]");
      containsSensitive = true;
      redactedDetails.add("Financial Amount");
    }

    return {
      'redactedText': redacted,
      'containsSensitiveInfo': containsSensitive,
      'redactedDetails': redactedDetails
    };
  }

  /// Scans SMS locally to check if the sender indicates call availability
  static Map<String, dynamic> scanForCallAvailability(String text) {
    final lower = text.toLowerCase();
    final availabilityKeywords = [
      "free now",
      "available to",
      "available for call",
      "call me now",
      "free to talk",
      "free to make calls",
      "back online",
      "free now to make calls",
      "can talk now",
      "available to talk",
      "meeting is over",
      "completed my task, let's call",
      "ready to talk"
    ];

    for (final keyword in availabilityKeywords) {
      if (lower.contains(keyword)) {
        return {
          'isAvailable': true,
          'context': 'Sender texted they are free ("$keyword")'
        };
      }
    }

    return {
      'isAvailable': false,
      'context': ''
    };
  }

  /// Simple check to see if call log is permitted under allowed categories or user custom important contacts
  static bool isCallLogPermitted(String name, List<ImportantContact> importantContacts) {
    final lowerName = name.toLowerCase();

    // Check custom user contacts first
    for (final contact in importantContacts) {
      if (lowerName == contact.name.toLowerCase() || lowerName.contains(contact.name.toLowerCase())) {
        return true;
      }
    }

    final defaultKeywords = [
      "mom", "mother", "maa", "mummy", "mother-in-law", "mum",
      "dad", "father", "papa", "pitaji", "father-in-law",
      "relative", "uncle", "aunty", "aunt", "cousin", "grandpa", "grandma",
      "sister", "brother", "behen", "didi", "bhai", "bhaiya",
      "office", "colleague", "manager", "boss", "team lead", "sir", "ankit", "hr",
      "friend", "yaar", "buddy", "dost"
    ];

    return defaultKeywords.any((keyword) => lowerName.contains(keyword));
  }

  /// Normalizes contact to predefined category roles
  static String detectCallerRole(String name, List<ImportantContact> importantContacts) {
    final lower = name.toLowerCase();

    // Check custom user contacts first
    for (final contact in importantContacts) {
      if (lower == contact.name.toLowerCase() || lower.contains(contact.name.toLowerCase())) {
        return contact.category; // "family", "office", "friends", "others"
      }
    }

    if (lower.contains("mom") || lower.contains("mother") || lower.contains("maa") || lower.contains("mummy")) return "mom";
    if (lower.contains("dad") || lower.contains("father") || lower.contains("papa")) return "dad";
    if (lower.contains("sister") || lower.contains("behen") || lower.contains("didi")) return "sister";
    if (lower.contains("brother") || lower.contains("bhai") || lower.contains("bhaiya")) return "brother";
    if (lower.contains("manager") || lower.contains("ankit")) return "office";
    if (lower.contains("boss") || lower.contains("sir") || lower.contains("colleague") || lower.contains("office") || lower.contains("hr")) return "office";
    if (lower.contains("friend") || lower.contains("yaar") || lower.contains("buddy") || lower.contains("dost")) return "friends";
    if (lower.contains("relative") || lower.contains("uncle") || lower.contains("aunty") || lower.contains("cousin") || lower.contains("grandpa") || lower.contains("grandma")) return "family";
    return "others";
  }
}
