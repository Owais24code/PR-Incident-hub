from app.routers.integrations import REDACTED_VALUE, merge_integration_config


def test_integration_config_merge_preserves_redacted_secrets():
    current = {
        "project_key": "SEC",
        "api_token": "stored-secret",
    }

    merged = merge_integration_config(
        current,
        {
            "project_key": "APPSEC",
            "api_token": REDACTED_VALUE,
            "display_name": "Security Engineering board",
        },
    )

    assert merged == {
        "project_key": "APPSEC",
        "api_token": "stored-secret",
        "display_name": "Security Engineering board",
    }


def test_integration_config_merge_can_remove_optional_metadata():
    merged = merge_integration_config(
        {"team_id": "T_DEMO", "channel_id": "C_OLD"},
        {"channel_id": None},
    )

    assert merged == {"team_id": "T_DEMO"}
