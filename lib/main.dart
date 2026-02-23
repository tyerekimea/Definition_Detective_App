import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

const String kDefaultAppUrl =
    String.fromEnvironment('APP_URL', defaultValue: 'https://traylapps.com');

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const DefinitionDetectiveApp());
}

class DefinitionDetectiveApp extends StatelessWidget {
  const DefinitionDetectiveApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Definition Detective',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF243447)),
        useMaterial3: true,
      ),
      home: const DefinitionDetectiveWebView(),
    );
  }
}

class DefinitionDetectiveWebView extends StatefulWidget {
  const DefinitionDetectiveWebView({super.key});

  @override
  State<DefinitionDetectiveWebView> createState() =>
      _DefinitionDetectiveWebViewState();
}

class _DefinitionDetectiveWebViewState
    extends State<DefinitionDetectiveWebView> {
  late final WebViewController _controller;
  late final WebViewWidget _webViewWidget;
  int _loadingProgress = 0;
  WebResourceError? _lastError;

  @override
  void initState() {
    super.initState();

    final WebViewController controller = WebViewController();

    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(kDebugMode);
      final AndroidWebViewController androidController =
          controller.platform as AndroidWebViewController;
      androidController.setMediaPlaybackRequiresUserGesture(false);
    }

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (!mounted) return;
            setState(() => _loadingProgress = progress);
          },
          onPageStarted: (_) {
            if (!mounted) return;
            setState(() {
              _lastError = null;
              _loadingProgress = 0;
            });
          },
          onPageFinished: (_) {
            if (!mounted) return;
            setState(() => _loadingProgress = 100);
          },
          onWebResourceError: (WebResourceError error) {
            if (error.isForMainFrame != true) return;
            if (!mounted) return;
            setState(() {
              _lastError = error;
            });
          },
        ),
      )
      ..loadRequest(Uri.parse(kDefaultAppUrl));

    PlatformWebViewWidgetCreationParams widgetParams =
        PlatformWebViewWidgetCreationParams(
          controller: controller.platform,
          layoutDirection: TextDirection.ltr,
        );

    if (controller.platform is AndroidWebViewController) {
      widgetParams =
          AndroidWebViewWidgetCreationParams
              .fromPlatformWebViewWidgetCreationParams(
                widgetParams,
                displayWithHybridComposition: true,
              );
    }

    _controller = controller;
    _webViewWidget = WebViewWidget.fromPlatformCreationParams(
      params: widgetParams,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Definition Detective'),
        actions: [
          IconButton(
            tooltip: 'Reload',
            onPressed: _controller.reload,
            icon: const Icon(Icons.refresh),
          ),
        ],
        bottom: _loadingProgress < 100
            ? PreferredSize(
                preferredSize: const Size.fromHeight(2),
                child: LinearProgressIndicator(value: _loadingProgress / 100),
              )
            : null,
      ),
      body: Stack(
        children: [
          _webViewWidget,
          if (_lastError != null)
            Positioned.fill(
              child: ColoredBox(
                color: Theme.of(context).colorScheme.surface,
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.wifi_off, size: 40),
                        const SizedBox(height: 12),
                        const Text(
                          'Could not load the web app.',
                          style: TextStyle(fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _lastError?.description ?? 'Unknown network error',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: () {
                            setState(() => _lastError = null);
                            _controller.reload();
                          },
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
