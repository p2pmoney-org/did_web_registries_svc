CREATE TABLE IF NOT EXISTS `webapp_registries_identifier_attribute_bodies` (
  `AttributeId` int(11) NOT NULL,
  `Body` TEXT NOT NULL,

  FOREIGN KEY (`AttributeId`) REFERENCES `webapp_registries_identifier_attributes`(`AttributeId`)
);