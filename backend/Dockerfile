FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -DskipTests dependency:go-offline

COPY src src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "if [ -z \"$SPRING_DATASOURCE_URL\" ] && [ -n \"$DATABASE_URL\" ]; then export SPRING_DATASOURCE_URL=\"jdbc:${DATABASE_URL}\"; fi; java -jar app.jar"]
