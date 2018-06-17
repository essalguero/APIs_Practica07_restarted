varying vec3 N;
varying vec4 vertexObserver;

varying vec2 fTexture;
uniform bool isTexturized;
uniform bool hasColor;
uniform sampler2D texSampler;
uniform vec4 color;

const int MAX_LIGHTS = 8;

uniform int numberLights;
uniform vec4 diffuse;
uniform int shininess;
uniform vec3 ambientLight;

uniform bool isCubemap;

uniform bool hasNormalTexture;
varying mat3 tbn;
uniform bool hasRefractionTexture;
uniform bool hasReflectionTexture;

uniform samplerCube texSamplerCube;

uniform sampler2D normalTexture;
uniform samplerCube  normalTextureCube;

uniform sampler2D refractionTexture;
uniform samplerCube  refractionTextureCube;

uniform sampler2D reflectionTexture;
uniform samplerCube  reflectionTextureCube;

varying vec3 uvw;

vec3 normalizedN;



struct LightInfo                                                           
{  
	vec4 lightColor;
	float linearAttenuation;

	vec4 lightVector;
};
uniform LightInfo lights[MAX_LIGHTS];

struct LightComponents
{
	vec4 diffuseComponent;
	vec4 specularComponent;
};


LightComponents calculateLight(int i)
{

	LightComponents currentLight;

	vec4 diffuseComponent = vec4(ambientLight, 1.0);
	vec4 specularComponent = vec4(0.0, 0.0, 0.0, 1.0);
	float NdotL;

	normalizedN = normalize(N);

	if (hasNormalTexture)
	{
		/*vec3 normalTextureSample = texture2D(normalTexture, fTexture).xyz;
		vec3 normalizedTextureSample = normalize((normalTextureSample * 0.5) + 0.5);
		normalizedN = normalize(normalizedTextureSample * tbn);*/

		//normalizedN =  texture2D(normalTexture, fTexture).xyz;

		normalizedN = texture2D(normalTexture, vec2(1, 1)).xyz;
	}

	vec3 L = lights[i].lightVector.xyz;

	float attenuationFactor = 1.0;

	if (lights[i].lightVector.w == 1.0)
	{
		L = L - vertexObserver.xyz;
		attenuationFactor = 1.0 / (1.0 + (lights[i].linearAttenuation * length(L)));
	}

	L = normalize(L);
	NdotL = max(dot(normalizedN, L), 0.0);

	diffuseComponent += NdotL * lights[i].lightColor * attenuationFactor;

	if ((shininess > 0) && (NdotL > 0.0))
	{
		vec4 vertexObserverNorm = normalize(vertexObserver);
		vec3 H = L - vertexObserverNorm.xyz;
		H = normalize(H);
		
		float NdotH = max(dot(normalizedN, H), 0.0);

		specularComponent += pow(NdotH, float(shininess)) * attenuationFactor;
	}

	currentLight.diffuseComponent = diffuseComponent;
	currentLight.specularComponent = specularComponent;

	return currentLight;
}


void main()
{
	vec4 diffuseComponent = vec4(0, 0, 0, 1);
	vec4 specularComponent = vec4(0, 0, 0, 1);
	LightComponents currentLight; 

	if (numberLights > 0)
	{
		vec4 totalIlumination = vec4(0, 0, 0, 1.0);

		for (int i = 0; i < numberLights; ++i)
		{
			currentLight = calculateLight(i);
			
			specularComponent += currentLight.specularComponent;
			diffuseComponent += currentLight.diffuseComponent;
			
		}

		if (hasColor)
		{
			if (isTexturized)
			{
				vec4 postLightColor = vec4(1.0, 1.0, 1.0, 1.0);
				if (isCubemap)
				{
					//gl_FragColor = (vec4(1.0, 1.0, 1.0, 1.0) * diffuseComponent * color * textureCube(texSamplerCube, uvw)) + specularComponent;
					postLightColor *= textureCube(texSamplerCube, uvw);
				}
				else
				{
					//gl_FragColor = (vec4(1.0, 1.0, 1.0, 1.0) * diffuseComponent * color * texture2D(texSampler, fTexture)) + specularComponent;
					//gl_FragColor = color;
					postLightColor *= texture2D(texSampler, fTexture);
				}

				postLightColor *= color;
				postLightColor *= diffuseComponent;
				postLightColor += specularComponent;

				/*vec4 reflectionColor = vec4(0.0, 0.0, 0.0, 0.0);
				if (hasReflectionTexture)
				{
					if (isCubemap)
					{
						reflectionColor = textureCube(reflectionTextureCube, uvw);
					}
					else
					{
						reflectionColor = texture2D(reflectionTexture, fTexture);
					}
				}

				vec4 refractionColor = vec4(0.0, 0.0, 0.0, 0.0);
				if (hasRefractionTexture)
				{
					if (isCubemap)
					{
						refractionColor = textureCube(refractionTextureCube, uvw);
					}
					else
					{
						refractionColor = texture2D(refractionTexture, fTexture);
					}
				}

				vec3 mixedColor = mix(postLightColor.rgb, reflectionColor.rgb, reflectionColor.a);
				mixedColor = mix(mixedColor.rgb, refractionColor.rgb, refractionColor.a);

				gl_FragColor = vec4(mixedColor, 1.0f);*/

				gl_FragColor = postLightColor;

			}
			else
			{
				gl_FragColor = (diffuseComponent * color) + specularComponent;
			}
		}

		// for debugging
		gl_FragColor = vec4(normalizedN, 1);

	}
	else
	{
		if (isTexturized)
		{
			gl_FragColor = diffuse * texture2D(texSampler, fTexture);
			//gl_FragColor = color;
		}
		else
		{
			gl_FragColor = color;
		}
	}

	/*if (hasColor)
	{
		gl_FragColor = vec4(N, 1);
	}
	else
	{
		gl_FragColor = vec4(1.0);
	}*/
}