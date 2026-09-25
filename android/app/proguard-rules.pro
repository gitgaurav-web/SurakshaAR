# Add project specific ProGuard rules here.

# Keep Capacitor Native Bridge & JS Interfaces
-keep class com.getcapacitor.** { *; }
-keep class in.gov.jharkhand.surakshaar.** { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod

