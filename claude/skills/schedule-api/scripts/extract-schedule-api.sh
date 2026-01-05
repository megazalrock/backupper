#!/bin/bash

# OpenAPIファイルからスケジュール関連のAPIを抽出するスクリプト
# 使用方法: ./extract-schedule-api.sh [オプション]
#
# オプション:
#   --paths       パス情報のみを抽出
#   --schemas     スキーマ情報のみを抽出
#   --responses   レスポンス情報のみを抽出
#   --all         すべての情報を抽出（デフォルト）
#   --summary     エンドポイントのサマリー一覧を表示

OPENAPI_FILE="/Users/otto/workspace/craftbank/arrangement-env/api/public/docs/openapi.json"

# ファイル存在チェック
if [ ! -f "$OPENAPI_FILE" ]; then
    echo "Error: OpenAPI file not found at $OPENAPI_FILE" >&2
    exit 1
fi

# jq存在チェック
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed" >&2
    exit 1
fi

# スケジュール関連のパスを抽出
extract_paths() {
    jq '{
        paths: .paths | to_entries | map(select(.key | startswith("/api/schedule"))) | from_entries
    }' "$OPENAPI_FILE"
}

# スケジュール関連のスキーマを抽出
extract_schemas() {
    jq '{
        schemas: .components.schemas | to_entries | map(
            select(
                .key | test("Schedule|schedule"; "i")
            )
        ) | from_entries
    }' "$OPENAPI_FILE"
}

# スケジュール関連のレスポンスを抽出
extract_responses() {
    jq '{
        responses: .components.responses | to_entries | map(
            select(
                .key | test("Schedule|schedule"; "i")
            )
        ) | from_entries
    }' "$OPENAPI_FILE"
}

# エンドポイントのサマリー一覧を表示
extract_summary() {
    jq -r '.paths | to_entries | map(select(.key | startswith("/api/schedule"))) | .[] |
        .key as $path |
        .value | to_entries[] |
        "\(.key | ascii_upcase)\t\($path)\t\(.value.summary // "No summary")"
    ' "$OPENAPI_FILE" | column -t -s $'\t'
}

# すべての情報を抽出
extract_all() {
    jq '{
        openapi: .openapi,
        info: .info,
        paths: .paths | to_entries | map(select(.key | startswith("/api/schedule"))) | from_entries,
        components: {
            schemas: .components.schemas | to_entries | map(
                select(.key | test("Schedule|schedule"; "i"))
            ) | from_entries,
            responses: .components.responses | to_entries | map(
                select(.key | test("Schedule|schedule"; "i"))
            ) | from_entries
        }
    }' "$OPENAPI_FILE"
}

# メイン処理
case "${1:-}" in
    --paths)
        extract_paths
        ;;
    --schemas)
        extract_schemas
        ;;
    --responses)
        extract_responses
        ;;
    --summary)
        extract_summary
        ;;
    --all|"")
        extract_all
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "OpenAPIファイルからスケジュール関連のAPIを抽出します。"
        echo ""
        echo "Options:"
        echo "  --paths       パス情報のみを抽出"
        echo "  --schemas     スキーマ情報のみを抽出"
        echo "  --responses   レスポンス情報のみを抽出"
        echo "  --summary     エンドポイントのサマリー一覧を表示"
        echo "  --all         すべての情報を抽出（デフォルト）"
        echo "  --help, -h    このヘルプを表示"
        ;;
    *)
        echo "Error: Unknown option: $1" >&2
        echo "Use --help for usage information" >&2
        exit 1
        ;;
esac