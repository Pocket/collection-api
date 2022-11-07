-- This is a fatto a mano migration to populate the Label table with the first, experimental label value.

INSERT INTO Label (externalId, name, createdBy, updatedAt) VALUES ('794ad945-e385-4820-b350-799a40ea5868', 'region-east-africa', 'backend-product-squad', CURRENT_TIMESTAMP(0));

